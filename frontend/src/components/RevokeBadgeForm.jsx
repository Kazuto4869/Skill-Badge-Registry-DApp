import { useState } from "react";
import Modal from "./Modal";
import TransactionFeedback from "./TransactionFeedback";
// Bấm Revoke mở xác nhận; chỉ Confirm mới gọi onRevoke để App yêu cầu MetaMask ký.
export default function RevokeBadgeForm({
  onRevoke,
  disabled,
  pending,
  feedback,
}) {
  const [id, setId] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <article className="panel">
      <span className="eyebrow">02 / MANAGE VALIDITY</span>
      <h3>Revoke a badge</h3>
      <p>Withdraw validity while keeping the original record intact.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setConfirm(true);
        }}
      >
        <label>
          Badge ID
          <input
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="Enter a badge ID"
            required
          />
        </label>
        <p className="fine-print">
          Revocation is permanent. This contract cannot restore a revoked badge.
        </p>
        <button
          className="secondary danger-button"
          disabled={disabled}
          type="submit"
        >
          {pending ? "Confirming on Sepolia…" : "Revoke Badge"}
        </button>
        {pending && (
          <p role="status">Approve in MetaMask, then wait for confirmation.</p>
        )}
        <TransactionFeedback feedback={feedback} />
      </form>
      {confirm && (
        <Modal title="Confirm revocation" onClose={() => setConfirm(false)}>
          <h2>Revoke badge #{id}?</h2>
          <p>
            This permanently invalidates the credential. Its on-chain record
            remains visible.
          </p>
          <div className="dialog-actions">
            <button className="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={disabled}
              onClick={() => {
                setConfirm(false);
                onRevoke(id);
              }}
            >
              Confirm revocation
            </button>
          </div>
        </Modal>
      )}
    </article>
  );
}
