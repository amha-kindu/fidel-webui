export function createHttpError(status, message) {
  const error = new Error(message || "Request failed");
  error.status = status;
  return error;
}

export function getFriendlyError(err, options = {}) {
  const { action, notFoundMessage } = options;
  const status = typeof err === "object" ? err?.status : undefined;
  const message = typeof err === "string" ? err : err?.message || "";

  if (status === 401) {
    return "የክፍለ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።";
  }
  if (status === 403) {
    return action ? `${action} እባክዎ በመለያዎ ይግቡ።` : "ለመቀጠል እባክዎ በመለያዎ ይግቡ።";
  }
  if (status === 404) {
    return notFoundMessage || "የፈለጉትን ነገር ማግኘት አልተቻለም።";
  }
  if (status === 409) {
    return "ይህ እርምጃ ከነባር መረጃ ጋር ይጋጫል። እባክዎ ገጹን አድስተው እንደገና ይሞክሩ።";
  }
  if (status === 413) {
    return "ይህ ፋይል በጣም ትልቅ ነው። እባክዎ ትንሽ ፋይል ይላኩ።";
  }
  if (status === 429) {
    return "ጥያቄዎች ብዛት በላይ ደርሷል። እባክዎ ትንሽ ጠብቀው እንደገና ይሞክሩ።";
  }
  if (status >= 500) {
    return "አገልጋዩ ችግኝ አጋጥሞታል። እባክዎ ቆይተው እንደገና ይሞክሩ።";
  }
  if (status >= 400) {
    return "ጥያቄዎን ማጠናቀቅ አልተቻለም። እባክዎ እንደገና ይሞክሩ።";
  }

  if (
    message.includes("Failed to fetch") ||
    message.includes("Network") ||
    message.includes("ECONN")
  ) {
    return "የኔትወርክ ችግኝ አለ። ግንኙነትዎን ያረጋግጡና እንደገና ይሞክሩ።";
  }
  if (message.includes("NEXT_PUBLIC_API_URL")) {
    return "አገልግሎቱ አልተዋቀረም። እባክዎ ድጋፍ ያነጋግሩ።";
  }
  if (message.includes("not responding")) {
    return "አገልግሎቱ ምላሽ አይሰጥም። እባክዎ ድጋፍ ያነጋግሩ።";
  }

  return "ያልታሰበ ችግኝ ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።";
}
