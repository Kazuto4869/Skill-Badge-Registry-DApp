// Duyệt ID từ mới nhất về cũ nhất bằng 4 worker; readBadge là callback từ web3.js.
export async function enumerateBadges(nextId, readBadge, signal) {
  // BigInt giữ chính xác ID Solidity; ID 0 không phải badge hợp lệ.
  let cursor = BigInt(nextId) - 1n;
  let failed = false;
  const badges = [];
  async function worker() {
    while (cursor > 0n && !failed) {
      // Dừng lập lịch đọc mới nếu App bỏ lượt tải; request RPC đã gửi có thể vẫn hoàn tất.
      signal?.throwIfAborted();
      const id = String(cursor--);
      try {
        badges.push(await readBadge(id));
      } catch (error) {
        // Một badge lỗi thì bỏ toàn bộ snapshot, không dùng phần đã đọc làm tổng.
        failed = true;
        throw error;
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  signal?.throwIfAborted();
  // Request có thể hoàn tất khác thứ tự; sắp lại theo ID giảm dần trước khi trả UI.
  return badges.sort((a, b) => (BigInt(a.id) > BigInt(b.id) ? -1 : 1));
}

// Lọc cục bộ, không gọi RPC: ID khớp chính xác, Course ID/ví khớp chuỗi con không phân biệt hoa/thường.
export function filterBadges(badges, field, query, status) {
  const search = query.trim().toLowerCase();
  return badges.filter((badge) => {
    const value = badge[field].toLowerCase();
    return (
      (status === "All" || badge.revoked === (status === "Revoked")) &&
      (!search || (field === "id" ? value === search : value.includes(search)))
    );
  });
}
