import BadgeArtwork from "./BadgeArtwork";
import Icon from "./Icon";
import { issuedDate, shortAddress } from "../utils";
// Nhãn trạng thái dùng chung cho card, chi tiết và Verify để cách hiển thị nhất quán.
export function BadgeStatus({ revoked }) {
  return (
    <span className={`status ${revoked ? "revoked" : "valid"}`}>
      <span className="dot" />
      {revoked ? "Revoked" : "Valid"}
    </span>
  );
}
// Một thẻ trong grid: artwork, Course ID, holder, ngày cấp và nút mở chi tiết.
export default function BadgeCard({ badge, onSelect }) {
  return (
    <article className="badge-card">
      <div className="artwork-panel">
        <span className="artwork-number mono">#{badge.id}</span>
        <BadgeArtwork courseId={badge.courseId} />
      </div>
      <div className="badge-card-content">
        <div className="badge-card-heading">
          <span className="eyebrow">SKILL CREDENTIAL</span>
          <BadgeStatus revoked={badge.revoked} />
        </div>
        <h3 title={badge.courseId}>{badge.courseId} Badge</h3>
        <dl className="card-facts">
          <div>
            <dt>Course ID</dt>
            <dd className="mono">{badge.courseId}</dd>
          </div>
          <div>
            <dt>Holder</dt>
            <dd className="mono" title={badge.holder}>
              {shortAddress(badge.holder)}
            </dd>
          </div>
          <div>
            <dt>Issued</dt>
            <dd>{issuedDate(badge.issuedAt)}</dd>
          </div>
        </dl>
        <button
          className="card-detail"
          onClick={() => onSelect(badge)}
          aria-label={`View badge ${badge.id} details`}
        >
          View credential <Icon name="arrow" />
        </button>
      </div>
    </article>
  );
}
