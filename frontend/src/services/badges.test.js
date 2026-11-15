import assert from "node:assert/strict";
import { test } from "node:test";
import { enumerateBadges, filterBadges } from "./badges.js";

// Dữ liệu bên dưới là fixture test cục bộ, không được đưa vào UI hoặc ghi lên blockchain.
test("enumeration reads every ID with at most four simultaneous requests", async () => {
  let active = 0;
  let peak = 0;
  const badges = await enumerateBadges(10n, async (id) => {
    peak = Math.max(peak, ++active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    return { id, courseId: "CS101", holder: "0xAbC", revoked: id === "2" };
  });
  assert.equal(badges.length, 9);
  assert.equal(new Set(badges.map((badge) => badge.id)).size, 9);
  assert.ok(peak <= 4);
  assert.equal(badges[0].id, "9");
});

test("empty registries, cancellation, and RPC failures never become partial totals", async () => {
  assert.deepEqual(await enumerateBadges(1n, () => assert.fail("no IDs")), []);
  await assert.rejects(
    enumerateBadges(2n, async () => {
      throw new Error("RPC unavailable");
    }),
    /RPC unavailable/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    enumerateBadges(3n, () => assert.fail("cancelled"), controller.signal),
    { name: "AbortError" },
  );
});

test("filters combine status with exact badge ID and case-insensitive course or holder search", () => {
  const badges = [
    { id: "1", courseId: "CS101", holder: "0xAbC", revoked: false },
    { id: "11", courseId: "WEB201", holder: "0xDEF", revoked: true },
  ];
  assert.deepEqual(filterBadges(badges, "id", "1", "All"), [badges[0]]);
  assert.deepEqual(filterBadges(badges, "courseId", "cs", "Valid"), [
    badges[0],
  ]);
  assert.deepEqual(filterBadges(badges, "holder", "0xdef", "Revoked"), [
    badges[1],
  ]);
  assert.deepEqual(filterBadges(badges, "holder", "0xdef", "Valid"), []);
});
