import test from "node:test";
import assert from "node:assert/strict";

import { createHttpError, getFriendlyError } from "../../lib/errorMessages.mjs";

test("getFriendlyError maps auth failures", () => {
  assert.equal(
    getFriendlyError(createHttpError(401, "Unauthorized")),
    "የክፍለ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።"
  );
});

test("getFriendlyError maps network failures", () => {
  assert.equal(
    getFriendlyError(new Error("Network error while sending your message.")),
    "የኔትወርክ ችግኝ አለ። ግንኙነትዎን ያረጋግጡና እንደገና ይሞክሩ።"
  );
});

test("getFriendlyError maps missing api configuration", () => {
  assert.equal(
    getFriendlyError(new Error("NEXT_PUBLIC_API_URL is not set.")),
    "አገልግሎቱ አልተዋቀረም። እባክዎ ድጋፍ ያነጋግሩ።"
  );
});
