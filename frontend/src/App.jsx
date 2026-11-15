import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import {
  connectWallet,
  getCurrentChainId,
  getConnectedAccount,
  getContractOwner,
  getAllBadges,
  issueBadge,
  revokeBadge,
  lookupBadge,
  CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
} from "./services/web3";
import Navbar from "./components/Navbar";
import DashboardStats from "./components/DashboardStats";
import BadgeCollection from "./components/BadgeCollection";
import BadgeDetailModal from "./components/BadgeDetailModal";
import IssueBadgeForm from "./components/IssueBadgeForm";
import RevokeBadgeForm from "./components/RevokeBadgeForm";
import VerifyBadge from "./components/VerifyBadge";
import Icon from "./components/Icon";
import { formatError } from "./utils";
// Trang tổng giữ dữ liệu và xử lý blockchain, rồi truyền dữ liệu/callback xuống các component UI.
export default function App() {
  // 1. Trạng thái ví: tài khoản, mạng, owner và kết quả kết nối MetaMask.
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [owner, setOwner] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  // 2. Snapshot chứa mọi badge tại một block; null nghĩa là chưa có dữ liệu dùng được.
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState("");
  // 3. Trạng thái UI: badge đang mở, giao dịch đang chờ và thông báo cho từng form.
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState("");
  const [feedback, setFeedback] = useState({});
  // Ref giữ giá trị qua các lần render: lượt tải bị bỏ, cờ chặn gửi lặp, số lượt đọc ví.
  const refreshController = useRef(null);
  const writeInFlight = useRef(false);
  const walletVersion = useRef(0);
  // So địa chỉ để hiện form; quyền thật vẫn do onlyOwner trong contract kiểm tra.
  const isAdmin = Boolean(
    account && owner && account.toLowerCase() === owner.toLowerCase(),
  );
  const isSepolia = chainId === SEPOLIA_CHAIN_ID;
  // 4. Đọc registry/owner; bỏ kết quả cũ nếu đã có lượt tải mới, không ngắt RPC đang gửi.
  const refresh = useCallback(async () => {
    refreshController.current?.abort();
    const controller = new AbortController();
    refreshController.current = controller;
    setLoading(true);
    setReadError("");
    setSelected(null);
    try {
      const [data, contractOwner] = await Promise.all([
        getAllBadges(controller.signal),
        getContractOwner(),
      ]);
      if (!controller.signal.aborted) {
        setSnapshot(data);
        setOwner(contractOwner);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setSnapshot(null);
        setReadError(formatError(err));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    const controllers = refreshController;
    return () => {
      clearTimeout(timer);
      controllers.current?.abort();
    };
  }, [refresh]);
  // 5. Khôi phục trạng thái ví và nghe thay đổi account/network; không tự mở popup kết nối.
  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    let active = true;
    // Chỉ lượt đọc mới nhất được cập nhật, tránh phản hồi chậm ghi đè tài khoản/mạng mới.
    async function syncWallet() {
      const version = ++walletVersion.current;
      try {
        const [currentAccount, currentChain] = await Promise.all([
          getConnectedAccount(),
          getCurrentChainId(),
        ]);
        if (active && version === walletVersion.current) {
          setAccount(currentAccount);
          setChainId(currentChain);
          setWalletError("");
        }
      } catch (err) {
        if (active && version === walletVersion.current)
          setWalletError(formatError(err));
      }
    }
    // Xóa quyền hiển thị cũ ngay, rồi đọc lại account và chain từ MetaMask.
    function changed() {
      setAccount("");
      setChainId(null);
      setSelected(null);
      setFeedback({});
      syncWallet();
    }
    // Sự kiện provider mất kết nối, không phải chức năng đăng xuất của ứng dụng.
    function disconnected() {
      ++walletVersion.current;
      setAccount("");
      setChainId(null);
      setSelected(null);
    }
    provider.on("accountsChanged", changed);
    provider.on("chainChanged", changed);
    provider.on("disconnect", disconnected);
    syncWallet();
    return () => {
      active = false;
      provider.removeListener("accountsChanged", changed);
      provider.removeListener("chainChanged", changed);
      provider.removeListener("disconnect", disconnected);
    };
  }, []);
  // 6. Yêu cầu MetaMask cấp quyền/chuyển mạng sau khi người dùng bấm nút.
  async function connect() {
    setConnecting(true);
    setWalletError("");
    try {
      await connectWallet();
      const version = ++walletVersion.current;
      const [currentAccount, currentChain] = await Promise.all([
        getConnectedAccount(),
        getCurrentChainId(),
      ]);
      if (version === walletVersion.current) {
        setAccount(currentAccount);
        setChainId(currentChain);
      }
    } catch (err) {
      setWalletError(formatError(err));
    } finally {
      setConnecting(false);
    }
  }
  // 7. Luồng chung cấp/thu hồi: chặn gửi lặp, chờ receipt, báo hash và đọc lại danh sách.
  async function transact(action, ...args) {
    if (!isAdmin || !isSepolia || writeInFlight.current) return false;
    writeInFlight.current = true;
    setPending(action);
    setFeedback((value) => ({ ...value, [action]: null }));
    try {
      const hash = await (action === "issue"
        ? issueBadge(...args)
        : revokeBadge(...args));
      setFeedback((value) => ({
        ...value,
        [action]: {
          message:
            action === "issue"
              ? "Badge issued. Transaction confirmed."
              : "Badge revoked. Transaction confirmed.",
          hash,
        },
      }));
      await refresh();
      return true;
    } catch (err) {
      setFeedback((value) => ({
        ...value,
        [action]: { error: true, message: formatError(err) },
      }));
      return false;
    } finally {
      writeInFlight.current = false;
      setPending("");
    }
  }
  // 8. JSX ghép các phần trang; câu chữ viết trong thẻ sẽ hiện trên frontend.
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* Thanh điều hướng nhận callback; không tự gọi blockchain. */}
      <Navbar account={account} connecting={connecting} onConnect={connect} />
      <main id="main" className="container">
        {/* Overview: tiêu đề, mô tả và thống kê từ snapshot của contract. */}
        <section
          id="overview"
          className="overview"
          aria-labelledby="overview-title"
        >
          <div className="overview-heading">
            <div>
              <span className="eyebrow">LEARNING, MADE VERIFIABLE</span>
              <h1 id="overview-title">
                Small badges.
                <br />
                <em>Lasting achievement.</em>
              </h1>
              <p>
                A record of skills earned. A collection of possibilities.
                <br className="desktop-break" /> Discover and verify credentials
                on the blockchain.
              </p>
            </div>
            <div className="overview-aside">
              <span className="network-tag">
                <span className="dot" /> ETHEREUM SEPOLIA
              </span>
              <p>
                Every achievement has a story.
                <br />
                This is where it lives on record.
              </p>
              <a className="text-link" href="#collection">
                Explore the collection <Icon name="arrow" />
              </a>
            </div>
          </div>
          <DashboardStats badges={snapshot?.badges} loading={loading} />
        </section>
        {/* Mạng ở đây là mạng của ví; RPC đọc collection luôn dùng Sepolia. */}
        <section
          className="wallet-panel"
          aria-label="Wallet and blockchain information"
        >
          <div>
            <span className="eyebrow">WALLET</span>
            <span className="mono wallet-address">
              {account || "Not connected"}
            </span>
          </div>
          <div>
            <span className="eyebrow">WALLET NETWORK</span>
            <span>
              {chainId == null
                ? "Not connected"
                : isSepolia
                  ? "Sepolia · 11155111"
                  : `Chain ${chainId}`}
            </span>
          </div>
          <div>
            <span className="eyebrow">YOUR ROLE</span>
            <span>{isAdmin ? "Admin" : "Viewer"}</span>
          </div>
          <a
            className="contract-link"
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            View contract ↗
          </a>
        </section>
        {walletError && (
          <div className="alert error" role="alert">
            {walletError}
          </div>
        )}
        {account && !isSepolia && (
          <div className="alert warning" role="status">
            Your wallet is on another network. Browsing uses Sepolia.{" "}
            <button
              className="secondary"
              disabled={connecting}
              onClick={connect}
            >
              Switch wallet to Sepolia
            </button>
          </div>
        )}
        {/* Collection nhận dữ liệu thật; bộ lọc chỉ thay đổi danh sách đang hiển thị. */}
        <BadgeCollection
          badges={snapshot?.badges}
          block={snapshot?.block}
          loading={loading}
          error={readError}
          onRefresh={refresh}
          onSelect={setSelected}
        />
        {/* Tra cứu độc lập với bộ lọc, không yêu cầu kết nối ví. */}
        <VerifyBadge onVerify={lookupBadge} />
        {/* Chỉ hiện form khi account trùng owner; sai mạng sẽ khóa nút gửi. */}
        <section
          id="admin"
          className="section admin-section"
          aria-labelledby="admin-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">REGISTRY MANAGEMENT</span>
              <h2 id="admin-title">Recognize the next achievement.</h2>
              <p>
                Issue and manage credentials with the contract owner wallet.
              </p>
            </div>
            <span className="role-tag">
              {isAdmin ? "Admin access" : "Owner access only"}
            </span>
          </div>
          {isAdmin ? (
            <>
              {!isSepolia && (
                <p className="alert warning">
                  Switch your wallet to Sepolia to manage credentials.
                </p>
              )}
              <div className="admin-grid">
                <IssueBadgeForm
                  onIssue={(...args) => transact("issue", ...args)}
                  disabled={!isSepolia || Boolean(pending)}
                  pending={pending === "issue"}
                  feedback={feedback.issue}
                />
                <RevokeBadgeForm
                  onRevoke={(id) => transact("revoke", id)}
                  disabled={!isSepolia || Boolean(pending)}
                  pending={pending === "revoke"}
                  feedback={feedback.revoke}
                />
              </div>
            </>
          ) : (
            <div className="admin-locked">
              <span className="locked-icon">
                <Icon />
              </span>
              <div>
                <h3>A little responsibility. A lasting record.</h3>
                <p>
                  {account
                    ? "Your connected wallet has viewer access. Connect the contract owner wallet to issue or revoke badges."
                    : "Connect the contract owner wallet to issue and revoke credentials."}
                </p>
              </div>
              <button
                className="secondary"
                disabled={connecting}
                onClick={connect}
              >
                {account ? "Check wallet access" : "Connect MetaMask"}
                <Icon name="wallet" />
              </button>
            </div>
          )}
        </section>
      </main>
      {/* Footer chứa nhận diện ứng dụng và địa chỉ contract đầy đủ. */}
      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href="#overview">
            <span className="brand-mark">
              <Icon />
            </span>
            <span>
              Skill Badge<span className="brand-subtitle">REGISTRY</span>
            </span>
          </a>
          <p>Skills earned. Achievements recorded.</p>
          <div>
            <span className="eyebrow">SEPOLIA REGISTRY CONTRACT</span>
            <a
              className="mono"
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              {CONTRACT_ADDRESS} ↗
            </a>
          </div>
        </div>
      </footer>
      {/* Chỉ tạo dialog khi có badge được chọn; đóng bằng cách xóa selected. */}
      {selected && (
        <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
