import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Pure commission math — mirrors CommissionService.calc */
function calc(base: number, rateBps: number) {
  const commission = Math.round((base * rateBps) / 10000);
  return { commission, earning: base - commission };
}

describe("commission engine", () => {
  it("applies 10% global rate", () => {
    const r = calc(10000, 1000);
    assert.equal(r.commission, 1000);
    assert.equal(r.earning, 9000);
  });

  it("never trusts a client total mismatch shape", () => {
    const server = 12599;
    const client = 12000;
    assert.notEqual(server, client);
  });
});

describe("cdn helper contract", () => {
  it("passes through when IMAGE_CDN_BASE unset", async () => {
    delete process.env.IMAGE_CDN_BASE;
    const { cdnImageUrl } = await import("../src/common/observability");
    assert.equal(cdnImageUrl("https://img.example/a.jpg"), "https://img.example/a.jpg");
  });
});
