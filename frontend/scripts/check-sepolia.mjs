import assert from "node:assert/strict";
import { createServer } from "vite";

// Nạp service qua Vite để dùng đúng .env/ABI của frontend; script không gửi giao dịch.
const server = await createServer({ server: { middlewareMode: true } });
try {
  const service = await server.ssrLoadModule("/src/services/web3.js");
  const [snapshot, owner] = await Promise.all([
    service.getAllBadges(),
    service.getContractOwner(),
  ]);
  assert.match(owner, /^0x[\da-f]{40}$/i);
  for (const badge of snapshot.badges) {
    const [verified, valid, holder, details] = await Promise.all([
      service.lookupBadge(badge.id),
      service.verifyBadge(badge.id),
      service.getBadgeHolder(badge.id),
      service.getBadge(badge.id),
    ]);
    assert.equal(verified.valid, !verified.revoked);
    assert.equal(valid, !details.revoked);
    assert.equal(holder.toLowerCase(), badge.holder.toLowerCase());
  }
  const nextId = String(BigInt(snapshot.badges.length) + 1n);
  assert.equal(await service.lookupBadge(nextId), null);
  await assert.rejects(service.lookupBadge("0"));
  await assert.rejects(service.lookupBadge(String(2n ** 256n)), /uint256/);

  // Provider kiểm thử cố tình báo lỗi nếu bị gọi: dữ liệu sai phải bị chặn trước khi tới MetaMask.
  globalThis.window = {
    ethereum: {
      request: async () => assert.fail("Invalid input reached MetaMask"),
    },
  };
  await assert.rejects(service.issueBadge("not-an-address", "CS101"));
  await assert.rejects(
    service.issueBadge("0x0000000000000000000000000000000000000000", "CS101"),
  );
  await assert.rejects(service.issueBadge(owner, "   "));
  await assert.rejects(service.revokeBadge("0"));
  await assert.rejects(service.revokeBadge(String(2n ** 256n)), /uint256/);
  delete globalThis.window;
  console.log(
    JSON.stringify(
      {
        contract: service.CONTRACT_ADDRESS,
        owner,
        block: snapshot.block,
        total: snapshot.badges.length,
        valid: snapshot.badges.filter((badge) => !badge.revoked).length,
        revoked: snapshot.badges.filter((badge) => badge.revoked).length,
      },
      null,
      2,
    ),
  );
  console.log(
    "Sepolia reads, verification, missing-ID handling, and invalid-write validation passed. No transactions sent.",
  );
} finally {
  await server.close();
}
