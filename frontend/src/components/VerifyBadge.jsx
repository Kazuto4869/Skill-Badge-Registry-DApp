import { useRef, useState } from "react";
import Icon from "./Icon";
import { BadgeStatus } from "./BadgeCard";
import { issuedDate, formatError } from "../utils";
// Giữ ID và kết quả tra cứu; chi tiết đọc Web3 nằm trong callback onVerify truyền từ App.
export default function VerifyBadge({ onVerify }) {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Tăng số lượt khi sửa ID/gửi lại để kết quả cũ không ghi đè kết quả của ID mới.
  const request = useRef(0);
  async function submit(event) {
    event.preventDefault();
    const current = ++request.current;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const badge = await onVerify(id);
      if (current === request.current) setResult({ badge, id });
    } catch (err) {
      if (current === request.current) setError(formatError(err));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }
  return (
    <section
      id="verify"
      className="section verify-section"
      aria-labelledby="verify-title"
    >
      <div className="verify-intro">
        <span className="eyebrow">TRUST, WITH A RECORD</span>
        <h2 id="verify-title">A skill worth verifying.</h2>
        <p>
          Look up a credential by its Badge ID. Check its holder, course, and
          current validity directly on Sepolia.
        </p>
        <span className="verification-note">
          <Icon /> Public verification · No wallet required
        </span>
      </div>
      <div className="verify-panel">
        <form onSubmit={submit}>
          <label htmlFor="verify-id">Badge ID</label>
          <div className="verify-input-row">
            <input
              id="verify-id"
              inputMode="numeric"
              pattern="[1-9][0-9]*"
              placeholder="Enter badge ID"
              value={id}
              onChange={(event) => {
                ++request.current;
                setId(event.target.value);
                setResult(null);
                setError("");
                setLoading(false);
              }}
              required
            />
            <button disabled={loading}>
              {loading ? "Checking…" : "Verify Badge"}
              <Icon name="arrow" />
            </button>
          </div>
        </form>
        {/* Lỗi RPC hiện riêng; badge null mới là không tồn tại, revoked vẫn có thông tin. */}
        <div aria-live="polite">
          {loading && <p role="status">Reading the credential on Sepolia…</p>}
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          {result &&
            (result.badge ? (
              <div className="verify-result">
                <div className="result-heading">
                  <h3>Badge #{result.badge.id}</h3>
                  <BadgeStatus revoked={result.badge.revoked} />
                </div>
                <dl className="detail-facts">
                  <div>
                    <dt>Course ID</dt>
                    <dd>{result.badge.courseId}</dd>
                  </div>
                  <div>
                    <dt>Holder</dt>
                    <dd className="mono">{result.badge.holder}</dd>
                  </div>
                  <div>
                    <dt>Issued date</dt>
                    <dd>{issuedDate(result.badge.issuedAt, true)}</dd>
                  </div>
                  <div>
                    <dt>Validity</dt>
                    <dd>
                      {result.badge.valid
                        ? "Valid"
                        : result.badge.revoked
                          ? "Revoked"
                          : "Invalid"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="verify-result">
                <h3>Invalid / Not Found</h3>
                <p>
                  No credential exists for Badge #{result.id} in this registry.
                </p>
              </div>
            ))}
        </div>
        {!result && !loading && !error && (
          <p className="verify-hint">
            A verifiable record. A little more peace of mind.
          </p>
        )}
      </div>
    </section>
  );
}
