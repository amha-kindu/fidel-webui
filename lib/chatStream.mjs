import { createHttpError } from "./errorMessages.mjs";
import {
  createBearerHeaders,
  isAbortError,
  readResponseErrorMessage,
  requireApiBaseUrl,
} from "./apiUtils.mjs";

export function extractStreamContent(payload) {
  return payload?.choices?.[0]?.delta?.content ?? "";
}

export function normalizeStreamPayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  const chatId = payload.chat_info?.id || payload.chat_info?.chat_id || payload.chat_info?.chatId;
  if (!chatId) return null;

  const assistantId = payload.id || payload.message_id || payload.messageId || null;
  const created = payload.created ?? Date.now();
  const createdAt = created < 1_000_000_000_000 ? created * 1000 : created;

  return {
    id: assistantId ? String(assistantId) : null,
    role: payload?.choices?.[0]?.delta?.role || "assistant",
    content: extractStreamContent(payload),
    createdAt,
    done: Boolean(payload.done),
    chatInfo: {
      id: String(chatId),
      title: payload.chat_info?.title || "ያልተሰየመ ውይይት",
    },
  };
}

export async function consumeSseStream(reader, { onPayload } = {}) {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let currentDataLines = [];
  let finalPayload = null;

  const flushEvent = () => {
    if (!currentDataLines.length) return;

    const dataString = currentDataLines.join("\n").trim();
    currentDataLines = [];

    if (!dataString || dataString === "[DONE]") return;

    let payload;
    try {
      payload = JSON.parse(dataString);
    } catch {
      return;
    }

    finalPayload = payload;
    onPayload?.(payload);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });

    let lineBreakIndex;
    while ((lineBreakIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, lineBreakIndex);
      buffer = buffer.slice(lineBreakIndex + 1);
      line = line.replace(/\r$/, "");

      if (line.startsWith(":")) continue;

      if (line === "") {
        flushEvent();
        continue;
      }

      if (line.startsWith("data:")) {
        currentDataLines.push(line.slice("data:".length).trimStart());
      }
    }
  }

  flushEvent();
  return finalPayload;
}

export async function sendStreamingRequest({
  apiUrl,
  chatId = null,
  message,
  model,
  token,
  signal,
  maxHistory = 20,
  onPayload,
}) {
  const baseUrl = requireApiBaseUrl(apiUrl);
  if (!token) throw new Error("Authentication required to chat.");

  const endpoint = `${baseUrl}/chats/stream${chatId ? `?id=${chatId}` : ""}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: createBearerHeaders(token, {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      }),
      signal,
      body: JSON.stringify({
        message,
        model,
        max_history: maxHistory,
      }),
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw err;
    }
    throw new Error("Network error while sending your message.");
  }

  if (!response.ok) {
    const detail = await readResponseErrorMessage(response, "Chat request failed");
    throw createHttpError(response.status, detail);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return null;
  }

  return consumeSseStream(reader, { onPayload });
}
