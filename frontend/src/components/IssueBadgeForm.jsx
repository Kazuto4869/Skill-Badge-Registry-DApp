import { useState } from "react";
import TransactionFeedback from "./TransactionFeedback";
// Form giữ dữ liệu nhập; App/service kiểm tra và gửi giao dịch qua callback onIssue.
export default function IssueBadgeForm({
  onIssue,
  disabled,
  pending,
  feedback,
}) {
  const [student, setStudent] = useState("");
  const [courseId, setCourseId] = useState("");
  async function submit(event) {
    event.preventDefault();
    // Chỉ xóa input sau khi App báo giao dịch thành công; lỗi thì giữ để sửa/gửi lại.
    if (await onIssue(student, courseId)) {
      setStudent("");
      setCourseId("");
    }
  }
  return (
    <article className="panel">
      <span className="eyebrow">01 / RECOGNIZE A SKILL</span>
      <h3>Issue a badge</h3>
      <p>Give a learner a permanent record of their achievement.</p>
      <form onSubmit={submit}>
        <label>
          Student wallet address
          <input
            autoComplete="off"
            value={student}
            onChange={(event) => setStudent(event.target.value)}
            placeholder="0x…"
            required
            className="mono"
          />
        </label>
        <label>
          Course ID
          <input
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            placeholder="Enter the course identifier"
            required
          />
        </label>
        <button disabled={disabled} type="submit">
          {pending ? "Confirming on Sepolia…" : "Issue Badge"}
        </button>
        {pending && (
          <p role="status">Approve in MetaMask, then wait for confirmation.</p>
        )}
        <TransactionFeedback feedback={feedback} />
      </form>
    </article>
  );
}
