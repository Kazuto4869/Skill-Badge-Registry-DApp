import Icon from "./Icon";
// Thống kê toàn bộ snapshot; không dùng danh sách đã lọc hay số ghi cố định.
export default function DashboardStats({ badges, loading }) {
  const revoked = badges?.filter((badge) => badge.revoked).length;
  // Chưa có dữ liệu thì hiện dấu gạch, đang tải hiện dấu ba chấm; không giả định là 0.
  const stats = [
    ["Total Badges", badges?.length, "Every credential, on record.", "badge"],
    [
      "Valid Badges",
      badges && badges.length - revoked,
      "Skills with a current credential.",
      "check",
    ],
    ["Revoked Badges", revoked, "Retained for a transparent history.", "close"],
  ];
  return (
    <div className="stats-grid" aria-busy={loading}>
      {stats.map(([label, value, caption, icon]) => (
        <article className="stat-card" key={label}>
          <div className="stat-top">
            <span>{label}</span>
            <span className={`stat-icon ${icon}`}>
              <Icon name={icon} />
            </span>
          </div>
          <strong className="stat-number">
            {loading ? "…" : value == null ? "—" : value.toLocaleString()}
          </strong>
          <p>{caption}</p>
        </article>
      ))}
    </div>
  );
}
