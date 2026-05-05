import test from "node:test";
import assert from "node:assert/strict";

import { requireApiBaseUrl, resolveApiBaseUrl } from "../../lib/apiUtils.mjs";

test("resolveApiBaseUrl falls back to same-origin api route", () => {
  assert.equal(resolveApiBaseUrl(undefined), "/api/v1");
  assert.equal(resolveApiBaseUrl(""), "/api/v1");
  assert.equal(resolveApiBaseUrl("   "), "/api/v1");
});

test("resolveApiBaseUrl strips trailing slashes from explicit overrides", () => {
  assert.equal(resolveApiBaseUrl("http://localhost:8000/api/v1/"), "http://localhost:8000/api/v1");
});

test("requireApiBaseUrl returns the deployed default when unset", () => {
  assert.equal(requireApiBaseUrl(undefined), "/api/v1");
});
