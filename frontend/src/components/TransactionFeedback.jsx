// Hiện lỗi hoặc kết quả giao dịch; chỉ tạo link Etherscan khi có transaction hash.
export default function TransactionFeedback({ feedback }) {
  if (!feedback) return null;
  return (
    <div
      className={`alert ${feedback.error ? "error" : "success"}`}
      role={feedback.error ? "alert" : "status"}
    >
      {feedback.message}
      {feedback.hash && (
        <a
          className="transaction-link mono"
          href={`https://sepolia.etherscan.io/tx/${feedback.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          {feedback.hash} ↗
        </a>
      )}
    </div>
  );
}
