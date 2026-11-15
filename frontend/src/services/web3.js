import { Web3 } from "web3";
import SkillBadgeRegistryABI from "../contracts/SkillBadgeRegistry.abi.json";
import { enumerateBadges } from "./badges.js";

// ======================================================
// 1. CẤU HÌNH CONTRACT VÀ MẠNG SEPOLIA
// ======================================================

// Đọc cấu hình công khai từ file frontend/.env.
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const SEPOLIA_CHAIN_ID = 11155111;

// READ dùng RPC Sepolia công khai, không phụ thuộc mạng đang chọn trong MetaMask.
const readWeb3 = new Web3(
  import.meta.env.VITE_SEPOLIA_RPC_URL ||
    "https://ethereum-sepolia-rpc.publicnode.com",
);

// Kiểm tra mạng/địa chỉ trước khi tạo contract cho .call(); không cần quyền kết nối ví.
async function getReadContract() {
  if (Number(await readWeb3.eth.getChainId()) !== SEPOLIA_CHAIN_ID) {
    throw new Error("The read RPC must use Ethereum Sepolia (11155111).");
  }
  if (!Web3.utils.isAddress(CONTRACT_ADDRESS))
    throw new Error("Invalid contract configuration.");
  return new readWeb3.eth.Contract(SkillBadgeRegistryABI, CONTRACT_ADDRESS);
}

// Chain ID dạng hexadecimal mà MetaMask sử dụng.
const SEPOLIA_CHAIN_ID_HEX = `0x${SEPOLIA_CHAIN_ID.toString(16)}`;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ======================================================
// 2. PROVIDER METAMASK: ĐỌC TRẠNG THÁI VÍ VÀ KÝ GIAO DỊCH
// ======================================================

/**
 * Lấy Ethereum Provider do MetaMask inject vào trình duyệt.
 * Dùng cho trạng thái ví và giao dịch; dữ liệu badge đọc qua readWeb3 riêng.
 */
function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask chưa được cài đặt hoặc chưa khả dụng.");
  }

  return window.ethereum;
}

// ======================================================
// 3. KHỞI TẠO WEB3 VÀ CONTRACT CHO GIAO DỊCH QUA VÍ
// ======================================================

/**
 * Khởi tạo Web3.js bằng MetaMask Provider.
 */
export function getWeb3() {
  return new Web3(getProvider());
}

/**
 * Tạo contract qua MetaMask cho .send(); ABI mô tả tên hàm/kiểu dữ liệu, không chứa bản ghi badge.
 */
function getContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Chưa cấu hình VITE_CONTRACT_ADDRESS trong .env.");
  }

  const web3 = getWeb3();

  // Kiểm tra địa chỉ contract trước khi khởi tạo.
  if (!web3.utils.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Contract Address không hợp lệ.");
  }

  return new web3.eth.Contract(SkillBadgeRegistryABI, CONTRACT_ADDRESS);
}

// ======================================================
// 4. KIỂM TRA/CHUYỂN MẠNG CỦA VÍ TRƯỚC KHI GỬI
// ======================================================

/**
 * Lấy Chain ID của mạng MetaMask đang chọn.
 * MetaMask trả Chain ID dưới dạng hexadecimal.
 */
export async function getCurrentChainId() {
  const chainIdHex = await getProvider().request({
    method: "eth_chainId",
  });

  return Number.parseInt(chainIdHex, 16);
}

/**
 * Đảm bảo MetaMask đang sử dụng Ethereum Sepolia.
 * Nếu sai mạng, yêu cầu MetaMask chuyển sang Sepolia.
 */
export async function ensureSepolia() {
  const provider = getProvider();

  const currentChainId = await getCurrentChainId();

  // Không cần chuyển mạng nếu đã ở Sepolia.
  if (currentChainId === SEPOLIA_CHAIN_ID) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (error) {
    // 4902: MetaMask chưa nhận diện mạng Sepolia.
    if (error.code === 4902) {
      throw new Error(
        "Chưa có Sepolia trong MetaMask. Hãy thêm mạng Sepolia trong ví.",
      );
    }

    // Giữ nguyên lỗi nếu người dùng từ chối hoặc có lỗi khác.
    throw error;
  }

  // Kiểm tra lại sau khi chuyển mạng.
  const newChainId = await getCurrentChainId();

  if (newChainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("Chuyển sang Sepolia không thành công.");
  }
}

// ======================================================
// 5. KẾT NỐI VÍ VÀ XÁC ĐỊNH TÀI KHOẢN GỬI
// ======================================================

/**
 * Yêu cầu người dùng kết nối tài khoản MetaMask.
 * Chỉ gọi hàm này khi người dùng nhấn Connect Wallet.
 */
export async function connectWallet() {
  const provider = getProvider();

  // Đảm bảo ví đang ở đúng Blockchain.
  await ensureSepolia();

  // Yêu cầu MetaMask cấp quyền truy cập tài khoản.
  const accounts = await provider.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("Không tìm thấy tài khoản MetaMask.");
  }

  return accounts[0];
}

/**
 * Lấy tài khoản đã cấp quyền cho website.
 * Hàm này không mở popup yêu cầu kết nối.
 */
export async function getConnectedAccount() {
  const accounts = await getProvider().request({
    method: "eth_accounts",
  });

  return accounts?.[0] || "";
}

/**
 * Lấy tài khoản đang kết nối để gửi giao dịch.
 * Không sử dụng private key trong Frontend.
 */
async function getTransactionSender() {
  await ensureSepolia();

  const account = await getConnectedAccount();

  if (!account) {
    throw new Error("Hãy kết nối MetaMask trước khi thực hiện giao dịch.");
  }

  return account;
}

// ======================================================
// 6. KIỂM TRA ĐẦU VÀO TRƯỚC KHI GỌI CONTRACT
// ======================================================

/**
 * Kiểm tra Badge ID.
 * Giữ ID dưới dạng string để tránh mất độ chính xác của uint256.
 */
function validateBadgeId(badgeId) {
  const id = String(badgeId).trim();

  if (!/^[1-9]\d*$/.test(id)) {
    throw new Error("Badge ID phải là số nguyên dương.");
  }

  if (BigInt(id) >= 2n ** 256n)
    throw new Error("Badge ID exceeds the uint256 range.");

  return id;
}

// ======================================================
// 7. ĐỌC OWNER ĐỂ HIỂN THỊ VAI TRÒ TRÊN UI
// ======================================================

/**
 * Lấy địa chỉ ví Admin được lưu trong Smart Contract.
 */
export async function getContractOwner() {
  return (await getReadContract()).methods.owner().call();
}

// ======================================================
// 8. HÀM GHI: METAMASK KÝ, CÓ GAS VÀ CHỜ RECEIPT
// ======================================================

/**
 * Cấp huy hiệu cho học viên.
 *
 * @param {string} student - Địa chỉ ví học viên.
 * @param {string} courseId - Mã khóa học.
 * @returns {string} Transaction hash.
 */
export async function issueBadge(student, courseId) {
  const web3 = getWeb3();

  const normalizedStudent = String(student).trim();
  const normalizedCourseId = String(courseId).trim();

  // Kiểm tra định dạng địa chỉ Ethereum.
  if (!web3.utils.isAddress(normalizedStudent)) {
    throw new Error("Địa chỉ ví học viên không hợp lệ.");
  }

  // Không cho phép cấp Badge cho zero address.
  if (normalizedStudent.toLowerCase() === ZERO_ADDRESS) {
    throw new Error("Không thể cấp Badge cho zero address.");
  }

  if (!normalizedCourseId) {
    throw new Error("Course ID không được để trống.");
  }

  // Lấy tài khoản hiện tại; onlyOwner trên contract mới quyết định tài khoản có được ghi hay không.
  const from = await getTransactionSender();

  // Gọi Smart Contract và yêu cầu MetaMask ký giao dịch.
  const receipt = await getContract()
    .methods.issueBadge(normalizedStudent, normalizedCourseId)
    .send({ from });

  return receipt.transactionHash;
}

/**
 * Thu hồi một huy hiệu đã cấp.
 *
 * @param {string|number} badgeId - ID của huy hiệu.
 * @returns {string} Transaction hash.
 */
export async function revokeBadge(badgeId) {
  const id = validateBadgeId(badgeId);

  const from = await getTransactionSender();

  const receipt = await getContract().methods.revokeBadge(id).send({ from });

  return receipt.transactionHash;
}

// ======================================================
// 9. HÀM ĐỌC: .call() KHÔNG KÝ VÀ KHÔNG TẠO GIAO DỊCH
// ======================================================

/**
 * Xác minh huy hiệu còn hợp lệ hay không.
 *
 * @param {string|number} badgeId - ID của huy hiệu.
 * @returns {boolean} true nếu tồn tại và chưa bị thu hồi.
 */
export async function verifyBadge(badgeId) {
  const id = validateBadgeId(badgeId);
  return (await getReadContract()).methods.verifyBadge(id).call();
}

/**
 * Lấy địa chỉ ví học viên sở hữu huy hiệu.
 *
 * @param {string|number} badgeId - ID của huy hiệu.
 * @returns {string} Địa chỉ ví học viên.
 */
export async function getBadgeHolder(badgeId) {
  const id = validateBadgeId(badgeId);
  return (await getReadContract()).methods.getBadgeHolder(id).call();
}

/**
 * Lấy toàn bộ thông tin của một huy hiệu.
 * Dùng để hiển thị Course ID, Holder, thời gian và trạng thái.
 */
export async function getBadge(badgeId) {
  const id = validateBadgeId(badgeId);
  const result = await (await getReadContract()).methods.getBadge(id).call();
  return normalizeBadge(result);
}

// Chuẩn hóa tuple Web3 thành object UI; uint256 giữ dạng chuỗi để không mất độ chính xác.
function normalizeBadge(result) {
  // Web3.js giải mã tuple của Solidity thành kết quả có thể
  // truy cập theo tên trường hoặc theo vị trí trong mảng.
  return {
    id: String(result.id ?? result[0]),
    courseId: result.courseId ?? result[1],
    holder: result.holder ?? result[2],
    issuedAt: String(result.issuedAt ?? result[3]),
    revoked: Boolean(result.revoked ?? result[4]),
  };
}

// Đọc mọi badge tại một block để tổng và trạng thái không lệch nhau khi có giao dịch mới.
export async function getAllBadges(signal) {
  const contract = await getReadContract();
  const block = await readWeb3.eth.getBlockNumber();
  const nextId = await contract.methods.nextBadgeId().call({}, block);
  // nextId chưa được cấp; chỉ đọc nextId - 1 về 1 với tối đa 4 worker.
  const badges = await enumerateBadges(
    nextId,
    async (id) =>
      normalizeBadge(await contract.methods.getBadge(id).call({}, block)),
    signal,
  );
  return { badges, block: String(block) };
}

// Kiểm tra tồn tại trước: null là không có badge; lỗi RPC được ném lên để UI báo lỗi mạng.
export async function lookupBadge(badgeId) {
  const id = validateBadgeId(badgeId);
  const contract = await getReadContract();
  const block = await readWeb3.eth.getBlockNumber();
  const nextId = await contract.methods.nextBadgeId().call({}, block);
  if (BigInt(id) >= BigInt(nextId)) return null;
  const [badge, valid, holder] = await Promise.all([
    contract.methods.getBadge(id).call({}, block),
    contract.methods.verifyBadge(id).call({}, block),
    contract.methods.getBadgeHolder(id).call({}, block),
  ]);
  return { ...normalizeBadge(badge), valid, holder };
}
