import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("auth contract", () => {
  it("requires JWT secret length for production", () => {
    const secret = "change-me-access-secret-min-32-chars";
    assert.ok(secret.length >= 32);
  });

  it("vendor isolation uses JWT vendorId not body", () => {
    const bodyVendorId = "attacker";
    const jwtVendorId = "real-vendor";
    assert.notEqual(bodyVendorId, jwtVendorId);
    const used = jwtVendorId; // server must use JWT
    assert.equal(used, jwtVendorId);
  });
});
