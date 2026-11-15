import Modal from "./Modal";
import BadgeArtwork from "./BadgeArtwork";
import { BadgeStatus } from "./BadgeCard";
import { issuedDate } from "../utils";
import { CONTRACT_ADDRESS } from "../services/web3";
// Hiện dữ liệu badge từ snapshot đã tải; không gửi giao dịch hoặc gọi thêm RPC.
export default function BadgeDetailModal({ badge, onClose }) {
  return (
    <Modal title="Credential details" onClose={onClose}>
      <div className="detail-artwork">
        <BadgeArtwork courseId={badge.courseId} />
      </div>
      <div className="detail-title">
        <h2>{badge.courseId} Badge</h2>
        <BadgeStatus revoked={badge.revoked} />
      </div>
      <dl className="detail-facts">
        <div>
          <dt>Badge ID</dt>
          <dd className="mono">{badge.id}</dd>
        </div>
        <div>
          <dt>Course ID</dt>
          <dd className="mono">{badge.courseId}</dd>
        </div>
        <div>
          <dt>Holder</dt>
          <dd className="mono">{badge.holder}</dd>
        </div>
        <div>
          <dt>Issued date</dt>
          <dd>{issuedDate(badge.issuedAt, true)}</dd>
        </div>
        <div>
          <dt>Issued timestamp</dt>
          <dd className="mono">{badge.issuedAt}</dd>
        </div>
        <div>
          <dt>Revoked</dt>
          <dd>{String(badge.revoked)}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>Ethereum Sepolia · 11155111</dd>
        </div>
        <div>
          <dt>Registry contract</dt>
          <dd>
            <a
              className="mono"
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              {CONTRACT_ADDRESS} ↗
            </a>
          </dd>
        </div>
      </dl>
      <p className="fine-print">
        Course ID is the course identifier stored on-chain. This contract does
        not store a separate course name or artwork.
      </p>
    </Modal>
  );
}
