import { useState } from "react";
import { filterBadges } from "../services/badges";
import BadgeCard from "./BadgeCard";
import Icon from "./Icon";
// Nhận badge từ App, giữ bộ lọc cục bộ và gọi onSelect khi người dùng mở chi tiết.
export default function BadgeCollection({
  badges,
  loading,
  error,
  onRefresh,
  onSelect,
  block,
}) {
  // query: từ khóa; field: trường cần tìm; status: All/Valid/Revoked.
  const [query, setQuery] = useState("");
  const [field, setField] = useState("id");
  const [status, setStatus] = useState("All");
  const filtered = filterBadges(badges || [], field, query, status);
  return (
    <section
      id="collection"
      className="section collection"
      aria-labelledby="collection-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE REGISTRY</span>
          <h2 id="collection-title">A collection of achievement.</h2>
          <p>Explore skills earned, issued, and recorded on Sepolia.</p>
        </div>
        <button className="secondary" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" />
          {loading ? "Refreshing…" : "Refresh registry"}
        </button>
      </div>
      <div className="collection-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filter badge status"
        >
          {["All", "Valid", "Revoked"].map((value) => (
            <button
              key={value}
              className={status === value ? "filter active" : "filter"}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="search-controls">
          <label className="sr-only" htmlFor="search-field">
            Search by
          </label>
          <select
            id="search-field"
            value={field}
            onChange={(event) => setField(event.target.value)}
          >
            <option value="id">Badge ID</option>
            <option value="courseId">Course ID</option>
            <option value="holder">Wallet address</option>
          </select>
          <div className="search-input">
            <Icon name="search" />
            <label className="sr-only" htmlFor="badge-search">
              Search{" "}
              {field === "id"
                ? "Badge ID"
                : field === "holder"
                  ? "wallet address"
                  : "Course ID"}
            </label>
            <input
              id="badge-search"
              type="search"
              placeholder="Search the collection…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>
      {/* Ưu tiên trạng thái tải/lỗi; chỉ hiện grid khi có dữ liệu phù hợp bộ lọc. */}
      {loading ? (
        <div className="empty-state" role="status">
          <span className="loading-mark" />
          <h3>Reading the registry</h3>
          <p>Fetching credentials directly from Sepolia.</p>
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <Icon name="close" />
          <h3>The registry is unavailable</h3>
          <p>{error}</p>
          <button className="secondary" onClick={onRefresh}>
            Try again
          </button>
        </div>
      ) : filtered.length ? (
        <>
          <div className="collection-caption">
            <span>
              {filtered.length}{" "}
              {filtered.length === 1 ? "credential" : "credentials"}
            </span>
            <span>
              On-chain snapshot · Block <span className="mono">{block}</span>
            </span>
          </div>
          <div className="badge-grid">
            {filtered.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} onSelect={onSelect} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Icon />
          <h3>
            {badges?.length
              ? "No matching credentials"
              : "The next achievement starts here."}
          </h3>
          <p>
            {badges?.length
              ? "Try another search or status filter."
              : "No badges have been issued by this contract yet."}
          </p>
          {(query || status !== "All") && (
            <button
              className="secondary"
              onClick={() => {
                setQuery("");
                setStatus("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
