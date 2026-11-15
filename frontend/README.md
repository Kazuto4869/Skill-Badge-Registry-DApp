# Hướng dẫn đọc mã frontend

Frontend là ứng dụng React + Vite. Xem [README tổng](../README.md) để biết cách chạy, cấu hình Sepolia, quy tắc contract và cách cấp/thu hồi badge.

Tài liệu này giúp tìm đúng file và hiểu các phần code trước khi sửa.

## 1. Thứ tự đọc code

1. [`index.html`](index.html) tạo `<div id="root">` và nạp `src/main.jsx`.
2. [`src/main.jsx`](src/main.jsx) render `<App />` vào `#root`, đồng thời nạp CSS toàn cục.
3. [`src/App.jsx`](src/App.jsx) giữ state chung, đồng bộ ví, gọi service và ghép các phần trang.
4. [`src/components/`](src/components/) nhận dữ liệu/callback từ App để hiển thị và xử lý thao tác người dùng.
5. [`src/services/web3.js`](src/services/web3.js) thực hiện việc đọc RPC và gửi giao dịch qua MetaMask.
6. [`src/services/badges.js`](src/services/badges.js) duyệt ID với giới hạn đồng thời và lọc danh sách đã tải.

Không cần đọc ABI JSON để sửa nội dung giao diện. ABI là mô tả giao tiếp contract, không phải nơi chứa danh sách badge.

## 2. Các nhóm trong App.jsx

Comment trong file đánh số các phần chính:

| Nhóm | Mục đích |
| --- | --- |
| State ví | `account`, `chainId`, `owner`, `connecting`, `walletError`: tài khoản, mạng, quyền và trạng thái kết nối. |
| Dữ liệu registry | `snapshot` chứa `{ badges, block }`; `loading` và `readError` quản lý trạng thái tải. |
| State giao diện | `selected` là badge đang mở chi tiết; `pending` xác định form đang gửi; `feedback` chứa kết quả từng form. |
| Ref | `refreshController` đánh dấu lượt tải bị bỏ; `writeInFlight` chặn gửi lặp; `walletVersion` tránh kết quả đọc ví cũ ghi đè kết quả mới. |
| `refresh()` | Đọc toàn bộ registry và owner; được gọi khi mở trang, bấm Refresh hoặc sau giao dịch thành công. |
| Effect MetaMask | Khôi phục tài khoản đã cấp quyền, nghe `accountsChanged`, `chainChanged`, `disconnect`; gỡ listener khi unmount. |
| `connect()` | Yêu cầu người dùng kết nối ví/chuyển Sepolia rồi cập nhật account và chain. |
| `transact()` | Điều phối issue/revoke, chờ receipt, báo transaction hash và tải lại registry. |
| JSX trả về | Navbar → Overview → thông tin ví → Collection → Verify → Admin → footer → dialog chi tiết. |

`useState` làm React render lại khi dữ liệu thay đổi. `useRef` giữ giá trị qua các lần render nhưng thay đổi nó không tự render. `useEffect` đồng bộ với hệ thống bên ngoài như RPC, MetaMask hoặc dialog trình duyệt.

## 3. Component nào nhận gì và làm gì?

**Prop** là dữ liệu hoặc hàm component cha truyền xuống component con. Ví dụ `onIssue` là callback: form gọi hàm đó, còn App/service chịu trách nhiệm thực hiện giao dịch.

| Component | Vai trò / dữ liệu chính |
| --- | --- |
| [`Navbar`](src/components/Navbar.jsx) | Menu và trạng thái ví; nhận `account`, `connecting`, `onConnect`. `open` chỉ dùng cho menu mobile. |
| [`DashboardStats`](src/components/DashboardStats.jsx) | Nhận toàn bộ `badges` và `loading`, tính tổng/valid/revoked. |
| [`BadgeCollection`](src/components/BadgeCollection.jsx) | Nhận danh sách, block, trạng thái tải/lỗi và callback refresh/chọn badge. Giữ `query`, `field`, `status` cục bộ. |
| [`BadgeCard`](src/components/BadgeCard.jsx) | Hiển thị một `badge`; gọi `onSelect(badge)` để mở chi tiết. File cũng export `BadgeStatus` dùng chung. |
| [`BadgeArtwork`](src/components/BadgeArtwork.jsx) | Nhận `courseId`, vẽ SVG cùng mẫu cho mọi badge. Icon được suy ra để minh họa, không phải dữ liệu môn học xác thực. |
| [`BadgeDetailModal`](src/components/BadgeDetailModal.jsx) | Nhận badge đã chọn và `onClose`; trình bày đủ các trường của badge và thông tin contract. |
| [`IssueBadgeForm`](src/components/IssueBadgeForm.jsx) | Giữ địa chỉ sinh viên và Course ID; gọi `onIssue`. Xóa input sau thành công, giữ lại khi lỗi. |
| [`RevokeBadgeForm`](src/components/RevokeBadgeForm.jsx) | Giữ ID và trạng thái xác nhận; gọi `onRevoke` sau khi người dùng xác nhận. |
| [`VerifyBadge`](src/components/VerifyBadge.jsx) | Giữ ID/kết quả/lỗi; gọi `onVerify`. Bỏ phản hồi cũ nếu người dùng đã sửa ID. |
| [`TransactionFeedback`](src/components/TransactionFeedback.jsx) | Hiển thị thông báo lỗi/thành công; thêm link giao dịch khi có hash. |
| [`Modal`](src/components/Modal.jsx) | Bọc `<dialog>` gốc: giữ focus, khóa cuộn nền và trả focus khi đóng. Nhận nội dung qua `children`. |
| [`Icon`](src/components/Icon.jsx) | Chọn icon SVG theo `name`; không cần tải ảnh hoặc thư viện icon ngoài. |

Các component form nhận `disabled`, `pending`, `feedback` để hiển thị trạng thái từ App. Chúng không tự giữ private key hay trực tiếp quyết định quyền owner.

## 4. Hai đường giao tiếp blockchain

### Đọc dữ liệu

```text
Component → callback App/service → readWeb3 → RPC Sepolia → .call() → dữ liệu trả về UI
```

Không cần kết nối MetaMask và không tạo giao dịch có gas. `getReadContract()` kiểm tra RPC đang ở đúng Sepolia.

- `getAllBadges()`: lấy block, đọc `nextBadgeId()`, rồi lấy các ID đã cấp tại block đó.
- `enumerateBadges()`: bốn worker dùng chung con trỏ ID, tránh gọi mọi badge cùng lúc. Nếu lỗi thì không dùng danh sách một phần làm tổng. Signal chỉ dừng lập lịch mới/bỏ kết quả; RPC đã gửi có thể vẫn chạy xong.
- `lookupBadge()`: kiểm tra tồn tại rồi đọc badge, validity và holder ở cùng block. Trả `null` nếu không tồn tại; lỗi RPC vẫn được ném lên.
- `normalizeBadge()`: đổi tuple từ Web3 thành object có `id`, `courseId`, `holder`, `issuedAt`, `revoked`.

### Ghi dữ liệu

```text
Form → App.transact() → issueBadge()/revokeBadge() → MetaMask → .send({ from }) → receipt
```

- `getWeb3()` / `getContract()` dùng provider MetaMask cho giao dịch.
- `ensureSepolia()` kiểm tra hoặc yêu cầu ví chuyển đúng mạng.
- `getTransactionSender()` lấy tài khoản hiện đang được cấp quyền.
- `issueBadge()` kiểm tra địa chỉ sinh viên, địa chỉ zero và Course ID rỗng.
- `revokeBadge()` kiểm tra ID nguyên dương trong phạm vi `uint256`.
- `.send()` chờ receipt rồi trả transaction hash để UI tạo link Etherscan.

`isAdmin` của App chỉ điều khiển giao diện. `onlyOwner` trong Solidity mới bảo vệ việc ghi dữ liệu.

## 5. Sửa câu chữ và giao diện

**Sửa chữ hiển thị:** mở JSX của khu vực cần sửa. Ví dụ câu “Small badges.” ở `App.jsx`, câu “A skill worth verifying.” ở `VerifyBadge.jsx`, nhãn các ô thống kê ở `DashboardStats.jsx`.

```jsx
// Chú thích code: không xuất hiện trên frontend.
<h2>Đây là câu hiện trên giao diện</h2>
```

Trong vùng JSX dùng `{/* Chú thích */}`; ngoài JSX dùng `// ...` hoặc `/* ... */`. Không thay tên hàm Solidity, trường dữ liệu hoặc thuộc tính HTML khi chỉ muốn sửa chữ.

**Sửa hình badge:** mở `BadgeArtwork.jsx`. Các đường `<path>` tạo khiên/ruy băng/icon; `viewBox` giữ tỷ lệ chung; `foreignObject` chứa chữ HTML trong SVG. Không cần tạo một ảnh mới cho từng Course ID.

**Sửa màu/font:** mở `src/index.css`, tìm `:root`. Các biến `--primary`, `--canvas`, `--ink`, `--surface-card`, `--success`, `--warning`, `--error` được dùng lại trong CSS.

**Sửa bố cục:** mở `src/App.css`, tìm comment tên khu vực hoặc className của component. Desktop dùng grid 3 cột; `@media (max-width: 1024px)` chuyển 2 cột; `@media (max-width: 767px)` chuyển 1 cột và menu mobile.

Bảng vị trí đầy đủ nằm trong [README tổng, mục 7](../README.md#7-muốn-sửa-phần-nào-thì-mở-file-nào).

## 6. Kiểm tra sau khi sửa

```powershell
npm test
npm run lint
npm run build
```

Nếu sửa service blockchain và cần kiểm tra contract thật:

```powershell
npm run check:sepolia
```

Script dùng đúng `.env`/ABI của frontend, kiểm tra các hàm đọc và validation đầu vào ghi. Provider giả chỉ được dùng để xác nhận dữ liệu sai bị chặn trước khi tới ví; **script không gửi giao dịch**. Dữ liệu fixture trong `badges.test.js` chỉ phục vụ unit test, không dùng làm dữ liệu hiển thị.

Build tạo `dist/` tự động; không sửa file trong đó. Không cần thêm dependency chỉ để sửa chữ, CSS hoặc comment. Các screenshot trong `docs/ui-validation/` là ảnh kiểm tra đã lưu, không phản ánh liên tục số badge hiện tại.

Cần tự kiểm tra MetaMask thật nếu thay đổi luồng kết nối/ký: từ chối yêu cầu, đổi account/mạng, receipt, lỗi giao dịch và dữ liệu sau xác nhận. Hiện ứng dụng chưa có nút Disconnect riêng; `disconnect` listener là sự kiện provider, không phải chức năng thu hồi quyền website.
