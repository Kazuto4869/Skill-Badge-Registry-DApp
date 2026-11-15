// Rút gọn cho dễ nhìn; địa chỉ đầy đủ vẫn được giữ trong object dữ liệu.
export const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected";
// Timestamp Solidity tính theo giây, Date nhận mili giây; kết quả dùng múi giờ trình duyệt.
export const issuedDate = (timestamp, full = false) =>
  new Date(Number(timestamp) * 1000).toLocaleString(
    "en-US",
    full ? { dateStyle: "long", timeStyle: "long" } : { dateStyle: "medium" },
  );
// Web3 có thể bọc lỗi MetaMask trong cause; đổi các lỗi thường gặp thành thông báo dễ hiểu.
export function formatError(error) {
  if (Number(error?.code) === 4001 || Number(error?.cause?.code) === 4001)
    return "The request was declined in MetaMask. You can try again.";
  const message = error?.cause?.message || error?.message || String(error);
  if (message.includes("Only admin"))
    return "Only the contract owner can manage badges.";
  if (message.includes("Badge already issued"))
    return "This wallet already has a badge for this course.";
  if (message.includes("Badge already revoked"))
    return "This badge has already been revoked.";
  if (message.includes("Badge not found")) return "Badge not found.";
  return message;
}
