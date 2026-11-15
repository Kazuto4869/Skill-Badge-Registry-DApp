import { useState } from "react";
import Icon from "./Icon";
import { shortAddress } from "../utils";
// Thanh điều hướng: chữ menu ở mảng bên dưới; kết nối ví do App xử lý qua onConnect.
export default function Navbar({ account, connecting, onConnect }) {
  // open điều khiển menu mobile; chọn mục sẽ đóng menu và cuộn đến section tương ứng.
  const [open, setOpen] = useState(false);
  return (
    <header className="nav-shell">
      <div className="navbar container">
        <a
          className="brand"
          href="#overview"
          aria-label="Skill Badge Registry home"
        >
          <span className="brand-mark">
            <Icon />
          </span>
          <span>
            Skill Badge<span className="brand-subtitle">REGISTRY</span>
          </span>
        </a>
        <button
          className="secondary menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={open ? "nav-links is-open" : "nav-links"}
        >
          {[
            ["overview", "Overview"],
            ["collection", "Badge Collection"],
            ["verify", "Verify"],
            ["admin", "Admin"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
        <button
          className={account ? "secondary wallet-button" : "wallet-button"}
          disabled={connecting}
          onClick={onConnect}
        >
          <Icon name="wallet" />
          {connecting ? (
            "Connecting…"
          ) : account ? (
            <>
              <span className="dot" />
              <span className="mono">{shortAddress(account)}</span>
            </>
          ) : (
            "Connect MetaMask"
          )}
        </button>
      </div>
    </header>
  );
}
