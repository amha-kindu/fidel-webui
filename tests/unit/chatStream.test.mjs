import test from "node:test";
import assert from "node:assert/strict";

import {
  consumeSseStream,
  normalizeStreamPayload,
  sendStreamingRequest,
} from "../../lib/chatStream.mjs";

test("consumeSseStream parses chunked SSE payloads and ignores DONE", async () => {
  const encoder = new TextEncoder();
  const chunks = [
    'data: {"id":"assistant-1","created":1714300000,"choices":[{"delta":{"role":"assistant","content":"Hello"}}],"chat_info":{"id":"chat-1","title":"Intro"},"done":false}\n',
    "\n",
    'data: {"id":"assistant-1","created":1714300001,"choices":[{"delta":{"role":"assistant","content":" world"}}],"chat_info":{"id":"chat-1","title":"Intro"},"done":true}\n\n',
    "data: [DONE]\n\n",
  ];

  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  const payloads = [];
  const finalPayload = await consumeSseStream(stream.getReader(), {
    onPayload: (payload) => payloads.push(payload),
  });

  assert.equal(payloads.length, 2);
  assert.equal(finalPayload.done, true);
  assert.equal(payloads[0].choices[0].delta.content, "Hello");
  assert.equal(payloads[1].choices[0].delta.content, " world");
});

test("normalizeStreamPayload returns a consistent assistant message shape", () => {
  const normalized = normalizeStreamPayload({
    id: "assistant-1",
    created: 1_714_300_000,
    choices: [{ delta: { role: "assistant", content: "Partial reply" } }],
    chat_info: { id: "chat-1", title: "Support request" },
    done: false,
  });

  assert.deepEqual(normalized, {
    id: "assistant-1",
    role: "assistant",
    content: "Partial reply",
    createdAt: 1_714_300_000_000,
    done: false,
    chatInfo: {
      id: "chat-1",
      title: "Support request",
    },
  });
});

test("normalizeStreamPayload leaves id empty when the stream payload has no message id", () => {
  const normalized = normalizeStreamPayload({
    created: 1_714_300_000,
    choices: [{ delta: { role: "assistant", content: "Partial reply" } }],
    chat_info: { id: "chat-1", title: "Support request" },
    done: false,
  });

  assert.equal(normalized.id, null);
});

test("sendStreamingRequest surfaces backend error details", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ detail: "Rate limited" }),
  });

  try {
    await assert.rejects(
      () =>
        sendStreamingRequest({
          apiUrl: "http://127.0.0.1:8000",
          message: "Hello",
          model: "fidel-chat",
          token: "test-token",
        }),
      (error) => {
        assert.equal(error.status, 429);
        assert.equal(error.message, "Rate limited");
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
