import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeChatSummaries,
  mergeMessages,
  normalizeChatListResponse,
  normalizeMessageListResponse,
} from "../../lib/chatData.mjs";

test("normalizeChatListResponse maps alternate backend fields", () => {
  const { items, total } = normalizeChatListResponse({
    items: [
      {
        chat_id: "chat-1",
        title: "First chat",
        last_message: "Latest update",
        created_at: "2026-04-28T10:00:00.000Z",
        updated_at: 1_714_300_000,
      },
    ],
    total: 1,
  });

  assert.equal(total, 1);
  assert.deepEqual(items[0], {
    id: "chat-1",
    title: "First chat",
    lastMessage: "Latest update",
    createdAt: 1_777_370_400_000,
    updatedAt: 1_714_300_000_000,
  });
});

test("mergeChatSummaries deduplicates by id and sorts by most recent update", () => {
  const merged = mergeChatSummaries(
    [
      { id: "chat-1", title: "Old", lastMessage: "A", createdAt: 1, updatedAt: 10 },
      { id: "chat-2", title: "Second", lastMessage: "B", createdAt: 1, updatedAt: 20 },
    ],
    [{ id: "chat-1", title: "Updated", lastMessage: "C", createdAt: 1, updatedAt: 30 }]
  );

  assert.deepEqual(merged.map((chat) => chat.id), ["chat-1", "chat-2"]);
  assert.equal(merged[0].title, "Updated");
});

test("normalizeMessageListResponse maps message fields and attachments", () => {
  const { items, total } = normalizeMessageListResponse({
    messages: [
      {
        message_id: "msg-1",
        role: "user",
        text: "Hello",
        created: 1_714_300_000,
        attachments: [
          {
            key: "attachment-1",
            filename: "report.pdf",
            contentType: "application/pdf",
            bytes: 512,
            href: "https://example.com/report.pdf",
          },
        ],
      },
    ],
    total: 1,
  });

  assert.equal(total, 1);
  assert.equal(items[0].createdAt, 1_714_300_000_000);
  assert.deepEqual(items[0].attachments[0], {
    id: "attachment-1",
    name: "report.pdf",
    type: "application/pdf",
    size: 512,
    url: "https://example.com/report.pdf",
  });
});

test("mergeMessages sorts chronologically and replaces duplicates", () => {
  const merged = mergeMessages(
    [
      { id: "assistant-1", role: "assistant", content: "Draft", createdAt: 30, done: false, attachments: [], rating: null },
      { id: "user-1", role: "user", content: "Question", createdAt: 10, done: true, attachments: [], rating: null },
    ],
    [{ id: "assistant-1", role: "assistant", content: "Final", createdAt: 30, done: true, attachments: [], rating: null }]
  );

  assert.deepEqual(merged.map((message) => message.id), ["user-1", "assistant-1"]);
  assert.equal(merged[1].content, "Final");
  assert.equal(merged[1].done, true);
});
