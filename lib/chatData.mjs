function toMilliseconds(value, fallback = Date.now()) {
  if (value == null) return fallback;

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))
        ? Number(value)
        : null;

  if (numeric != null) {
    return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((attachment, index) => {
      if (!attachment || typeof attachment !== "object") return null;

      return {
        id: attachment.id || attachment.key || attachment.url || `attachment-${index}`,
        name: attachment.name || attachment.filename || "አባሪ",
        type: attachment.type || attachment.contentType || "",
        size: attachment.size || attachment.bytes || 0,
        url: attachment.url || attachment.href || null,
      };
    })
    .filter(Boolean);
}

export function extractCollectionItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  return payload.items || payload.messages || payload.history || [];
}

export function normalizeChatSummary(chat, fallbackIndex = 0) {
  if (!chat || typeof chat !== "object") return null;

  const id = chat.id || chat.chat_id || chat.chatId;
  if (!id) return null;

  const title = safeText(chat.title, "ያልተሰየመ ውይይት");
  const lastMessage = safeText(
    chat.lastMessage ?? chat.last_message ?? chat.preview ?? chat.summary,
    ""
  );
  const createdAt = toMilliseconds(
    chat.createdAt ?? chat.created_at ?? chat.created ?? chat.timestamp,
    Date.now() - fallbackIndex
  );
  const updatedAt = toMilliseconds(
    chat.updatedAt ?? chat.updated_at ?? chat.modified_at ?? chat.createdAt ?? chat.created_at,
    createdAt
  );

  return {
    id: String(id),
    title,
    lastMessage,
    createdAt,
    updatedAt,
  };
}

export function normalizeMessage(message, fallbackIndex = 0) {
  if (!message || typeof message !== "object") return null;

  const id =
    message.id ||
    message.message_id ||
    message.messageId ||
    `message-${fallbackIndex}-${message.role || "assistant"}`;
  const role = message.role === "user" ? "user" : "assistant";
  const content = safeText(
    typeof message.content === "string"
      ? message.content
      : message.text ?? message.body ?? "",
    ""
  );
  const createdAt = toMilliseconds(
    message.createdAt ?? message.created_at ?? message.created ?? message.timestamp,
    Date.now() + fallbackIndex
  );

  return {
    id: String(id),
    role,
    content,
    createdAt,
    done: Boolean(message.done ?? true),
    attachments: normalizeAttachments(message.attachments),
    rating: message.rating || null,
  };
}

function dedupeById(items) {
  const seen = new Map();

  for (const item of items) {
    if (!item?.id) continue;
    seen.set(item.id, item);
  }

  return [...seen.values()];
}

export function mergeChatSummaries(existing = [], incoming = []) {
  return dedupeById([...(existing || []), ...(incoming || [])]).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

export function upsertChatSummary(existing = [], chat) {
  if (!chat?.id) return existing || [];
  return mergeChatSummaries(existing, [chat]);
}

export function mergeMessages(existing = [], incoming = []) {
  return dedupeById([...(existing || []), ...(incoming || [])]).sort(
    (a, b) => a.createdAt - b.createdAt
  );
}

export function normalizeChatListResponse(payload) {
  const items = extractCollectionItems(payload)
    .map((item, index) => normalizeChatSummary(item, index))
    .filter(Boolean);
  const total = typeof payload?.total === "number" ? payload.total : items.length;

  return { items, total };
}

export function normalizeMessageListResponse(payload) {
  const items = extractCollectionItems(payload)
    .map((item, index) => normalizeMessage(item, index))
    .filter(Boolean);
  const total = typeof payload?.total === "number" ? payload.total : items.length;

  return { items, total };
}
