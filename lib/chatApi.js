import { sendStreamingRequest } from "./chatStream.mjs";

export async function sendChatRequest({
  apiUrl,
  message,
  chatId = null,
  model,
  onPayload,
  token,
  signal,
  maxHistory = 20,
}) {
  return sendStreamingRequest({
    apiUrl,
    message,
    chatId,
    model,
    onPayload,
    token,
    signal,
    maxHistory,
  });
}
