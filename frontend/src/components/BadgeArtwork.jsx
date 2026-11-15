// Contract chỉ lưu Course ID, không có tên môn riêng hoặc URL ảnh; không tự tạo tên môn.
// Vẽ một mẫu khiên/ruy băng SVG cố định; màu và font lấy từ các class trong App.css.
export default function BadgeArtwork({ courseId }) {
  // Chọn icon minh họa từ mã môn; icon không phải metadata được xác thực trên blockchain.
  const coding = /cs|web|code|sol|dev|block/i.test(courseId);
  const data = /data|ai|ml|stat/i.test(courseId);
  return (
    <svg
      className="badge-artwork"
      viewBox="0 0 320 252"
      role="img"
      aria-label={`${courseId} skill badge`}
    >
      <path
        className="art-ribbon"
        d="M117 172 108 236 160 215 212 236 203 172Z"
      />
      <path
        className="art-shield"
        d="M160 14 266 52V136Q266 191 160 222Q54 191 54 136V52Z"
      />
      <path
        className="art-outline"
        d="M160 26 253 61V135Q253 181 160 208Q67 181 67 135V61Z"
      />
      <text x="160" y="61" className="art-label">
        SKILL BADGE REGISTRY
      </text>
      <g
        className="art-icon"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="160" cy="96" r="23" />
        {coding ? (
          <path d="m151 88-8 8 8 8m18-16 8 8-8 8m-6-20-6 24" />
        ) : data ? (
          <path d="M147 106V96m13 10V84m13 22V91m-29 19h32" />
        ) : (
          <path d="M145 86q8-3 15 2 7-5 15-2v20q-8-3-15 2-7-5-15-2Zm15 2v20" />
        )}
      </g>
      <foreignObject x="78" y="128" width="164" height="43">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="art-course"
          title={courseId}
        >
          {courseId}
        </div>
      </foreignObject>
      <foreignObject x="84" y="177" width="152" height="18">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="art-course-id"
          title={courseId}
        >
          COURSE / {courseId}
        </div>
      </foreignObject>
    </svg>
  );
}
