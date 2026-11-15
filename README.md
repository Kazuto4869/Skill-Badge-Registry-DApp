# Skill Badge Registry DApp

Ứng dụng quản lý huy hiệu kỹ năng trên Ethereum Sepolia. Trung tâm đào tạo dùng ví owner để cấp hoặc thu hồi badge; người xem có thể tìm kiếm và xác minh badge mà không cần kết nối ví.

Dự án hiện dùng **React + Vite + Web3.js + MetaMask**, gọi trực tiếp Smart Contract. **Không có backend, Express hoặc database** trong kiến trúc hiện tại.

## 1. Chạy ứng dụng

Cần Node.js tương thích với Vite (20.19+ trong nhánh 20, hoặc 22.12+; có thể dùng Node.js 24) và npm. Cài MetaMask nếu cần kết nối ví hoặc ký giao dịch.

Tại thư mục `skill-badge-dapp`:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Mở URL Vite in ra terminal, thường là `http://localhost:5173`. Giữ terminal chạy trong lúc sử dụng. Bấm `Ctrl+C` để dừng server.

Các lệnh khác chạy trong thư mục `frontend`:

| Lệnh | Dùng để làm gì? |
| --- | --- |
| `npm run build` | Biên dịch bản production vào `dist/`. |
| `npm run preview` | Xem bản production đã build. |
| `npm run lint` | Kiểm tra quy tắc viết code. |
| `npm test` | Test giới hạn đọc đồng thời, xử lý lỗi/hủy và bộ lọc bằng dữ liệu kiểm thử cục bộ. |
| `npm run check:sepolia` | Đọc contract thật và kiểm tra các hàm tra cứu, xác minh, validation; không gửi giao dịch. |

`build`, `lint` và `test` không cần ví. `check:sepolia` cần Internet và RPC hoạt động. Muốn issue/revoke thật, ví owner cần ETH thử nghiệm trên Sepolia để trả gas.

## 2. Cấu hình blockchain

File cấu hình nằm ở [`frontend/.env`](frontend/.env):

```dotenv
VITE_CONTRACT_ADDRESS=0x09ec1E50088a14d244d547Ea6B7faD69d004F329
VITE_CHAIN_ID=11155111
```

- Mạng sử dụng: **Ethereum Sepolia**, Chain ID `11155111`. Service cũng cố định Chain ID này để tránh gửi giao dịch nhầm mạng.
- Contract: [xem trên Sepolia Etherscan](https://sepolia.etherscan.io/address/0x09ec1E50088a14d244d547Ea6B7faD69d004F329).
- RPC đọc mặc định: `https://ethereum-sepolia-rpc.publicnode.com`.
- Có thể cấu hình thêm `VITE_SEPOLIA_RPC_URL` để dùng một RPC Sepolia khác. Service kiểm tra Chain ID của RPC trước khi đọc.
- Khởi động lại Vite sau khi sửa `.env`. Biến `VITE_*` được đưa ra trình duyệt; không lưu private key, seed phrase hoặc thông tin bí mật trong đó.

## 3. Giao diện gồm những phần nào?

| Phần | Chức năng |
| --- | --- |
| Navigation | Đi tới Overview, Badge Collection, Verify, Admin và kết nối MetaMask. |
| Overview | Hiển thị tổng badge, badge hợp lệ và badge đã thu hồi từ dữ liệu contract. |
| Badge Collection | Hiển thị toàn bộ registry; tìm theo Badge ID, Course ID hoặc ví; lọc All/Valid/Revoked. |
| Chi tiết badge | Xem ID, Course ID, holder, thời gian cấp, trạng thái revoked, mạng và contract. |
| Verify | Tra cứu ID và phân biệt Valid, Revoked, Invalid / Not Found. |
| Admin | Hiển thị form cấp/thu hồi khi ví kết nối trùng owner được đọc từ contract. |
| Thông tin ví | Hiển thị tài khoản, mạng của ví, vai trò Admin/Viewer và liên kết contract. |

Collection hiển thị badge của **mọi ví trong contract**, không chỉ badge của ví đang kết nối. Nếu chưa có badge cho một môn, môn đó chưa xuất hiện trong collection.

## 4. Cách sử dụng

### Xem và xác minh

1. Mở ứng dụng; danh sách và thống kê tự đọc từ Sepolia qua RPC công khai.
2. Chọn loại tìm kiếm rồi nhập ID, mã khóa học hoặc địa chỉ ví. Badge ID so khớp chính xác; Course ID và ví tìm theo chuỗi con, không phân biệt hoa/thường.
3. Bấm **View credential** để mở chi tiết; bấm nút đóng hoặc `Esc` để thoát.
4. Trong **Verify**, nhập Badge ID rồi bấm **Verify Badge**. Lỗi RPC được hiển thị là lỗi, không bị coi thành badge không tồn tại.

### Cấp badge

1. Bấm **Connect MetaMask** và kết nối ví owner. Chuyển sang Sepolia khi MetaMask yêu cầu.
2. Mở **Admin → Issue a badge**.
3. Nhập địa chỉ ví học viên và Course ID.
4. Bấm **Issue Badge**, kiểm tra và xác nhận giao dịch trên MetaMask.
5. Chờ giao dịch được xác nhận. Ứng dụng hiển thị transaction hash và tải lại danh sách/thống kê.

### Thu hồi badge

1. Dùng ví owner trên Sepolia, nhập Badge ID ở **Revoke a badge**.
2. Bấm **Revoke Badge** rồi xác nhận trong hộp thoại của ứng dụng.
3. Xác nhận giao dịch trên MetaMask và chờ receipt.
4. Badge vẫn còn trong collection nhưng chuyển sang **Revoked**. Contract không hỗ trợ khôi phục badge đã thu hồi.

### Ngắt kết nối

Hiện giao diện **chưa có nút Disconnect riêng**. Muốn ngắt quyền của website, thực hiện trong MetaMask ở phần quản lý quyền/kết nối website. Bấm vào địa chỉ ví trên thanh điều hướng hiện gọi lại luồng kết nối, không phải đăng xuất. Đóng tab cũng không tự xóa quyền đã cấp cho website.

## 5. Quy tắc của Smart Contract

Mã nguồn ở [`frontend/src/contracts/SkillBadgeRegistry.sol`](frontend/src/contracts/SkillBadgeRegistry.sol); ABI ở [`frontend/src/contracts/SkillBadgeRegistry.abi.json`](frontend/src/contracts/SkillBadgeRegistry.abi.json).

| Dữ liệu / hàm | Ý nghĩa |
| --- | --- |
| `owner()` | Ví triển khai contract; chỉ ví này được cấp/thu hồi. |
| `nextBadgeId()` | ID sẽ cấp tiếp theo, bắt đầu từ 1. Các ID đã cấp là `1..nextBadgeId - 1`. |
| `issueBadge(student, courseId)` | Cấp badge cho ví và mã khóa học; cần giao dịch có chữ ký. |
| `revokeBadge(badgeId)` | Đánh dấu badge đã thu hồi; cần giao dịch có chữ ký. |
| `verifyBadge(badgeId)` | Trả `true` nếu badge tồn tại và chưa bị thu hồi. |
| `getBadgeHolder(badgeId)` | Trả địa chỉ ví giữ badge; revert nếu không tồn tại. |
| `getBadge(badgeId)` | Trả toàn bộ thông tin badge; revert nếu không tồn tại. |

Mỗi badge có các trường:

| Trường | Nội dung |
| --- | --- |
| `id` | Mã badge duy nhất, kiểu `uint256`. |
| `courseId` | Mã khóa học do Admin nhập. |
| `holder` | Địa chỉ ví học viên. |
| `issuedAt` | Unix timestamp theo giây tại block cấp badge. |
| `revoked` | `true` nếu đã thu hồi. |

Một cặp **Course ID + địa chỉ ví** chỉ được cấp một lần trong suốt vòng đời, kể cả sau khi thu hồi. Course ID trên contract phân biệt hoa/thường; bộ lọc giao diện thì không. Không cấp cho địa chỉ zero hoặc mã khóa học rỗng.

Contract không lưu danh mục môn học, tên môn riêng hay hình ảnh. Frontend dùng `<Course ID> Badge` làm tiêu đề và vẽ artwork SVG dùng chung. Muốn thêm badge môn khác, Admin cấp badge với Course ID tương ứng; không cần tạo thêm file ảnh hoặc component cho môn đó.

## 6. Dữ liệu đi từ đâu tới đâu?

```text
Mở trang / Refresh registry
  → App.jsx gọi getAllBadges() và getContractOwner()
  → services/web3.js đọc RPC Sepolia
  → nextBadgeId() → đọc getBadge(id) với tối đa 4 worker
  → trả { badges, block }
  → App lưu snapshot → truyền dữ liệu xuống Stats và Collection

Bấm Issue / xác nhận Revoke
  → form gọi callback của App.jsx
  → transact() gọi issueBadge() / revokeBadge() trong service
  → kiểm tra đầu vào, mạng và tài khoản
  → MetaMask ký → contract kiểm tra onlyOwner → nhận receipt
  → hiển thị transaction hash → đọc lại registry

Bấm Verify
  → VerifyBadge gọi onVerify(id)
  → lookupBadge() kiểm tra tồn tại rồi đọc thông tin, validity và holder
  → hiển thị kết quả hoặc lỗi đọc mạng
```

Các lần đọc collection dùng chung một block để thống kê và trạng thái badge nhất quán. ID được giữ dạng chuỗi/BigInt để tránh mất độ chính xác của `uint256`. Nếu tải thất bại, giao diện báo lỗi; không lấy một phần danh sách để hiển thị thành tổng đầy đủ.

Việc ẩn form Admin chỉ giúp giao diện rõ ràng. **Quyền thực sự do `onlyOwner` trên contract kiểm tra**, không do React quyết định.

## 7. Muốn sửa phần nào thì mở file nào?

| Muốn sửa | File |
| --- | --- |
| Câu tiêu đề “Small badges…”, đoạn giới thiệu, thông tin ví, phần Admin và footer | [`frontend/src/App.jsx`](frontend/src/App.jsx) |
| Chữ menu, logo và nút kết nối | [`Navbar.jsx`](frontend/src/components/Navbar.jsx) |
| Nhãn Total / Valid / Revoked Badges | [`DashboardStats.jsx`](frontend/src/components/DashboardStats.jsx) |
| Tiêu đề collection, ô tìm kiếm, bộ lọc và thông báo rỗng | [`BadgeCollection.jsx`](frontend/src/components/BadgeCollection.jsx) |
| Nội dung một thẻ badge | [`BadgeCard.jsx`](frontend/src/components/BadgeCard.jsx) |
| Hình badge SVG | [`BadgeArtwork.jsx`](frontend/src/components/BadgeArtwork.jsx) |
| Nội dung popup chi tiết | [`BadgeDetailModal.jsx`](frontend/src/components/BadgeDetailModal.jsx) |
| Tiêu đề, form và kết quả xác minh | [`VerifyBadge.jsx`](frontend/src/components/VerifyBadge.jsx) |
| Form cấp / thu hồi | [`IssueBadgeForm.jsx`](frontend/src/components/IssueBadgeForm.jsx), [`RevokeBadgeForm.jsx`](frontend/src/components/RevokeBadgeForm.jsx) |
| Màu, font, kích thước bo góc và style cơ bản | [`frontend/src/index.css`](frontend/src/index.css) |
| Bố cục, khoảng cách, grid, responsive | [`frontend/src/App.css`](frontend/src/App.css) |
| Gọi MetaMask / contract / RPC | [`frontend/src/services/web3.js`](frontend/src/services/web3.js) |
| Duyệt ID đồng thời và lọc danh sách | [`frontend/src/services/badges.js`](frontend/src/services/badges.js) |
| Rút gọn địa chỉ, định dạng ngày, giải thích lỗi | [`frontend/src/utils.js`](frontend/src/utils.js) |
| Tiêu đề tab trình duyệt, description, file HTML gốc | [`frontend/index.html`](frontend/index.html) |
| Icon trên tab | [`frontend/public/favicon.svg`](frontend/public/favicon.svg) |

Ví dụ sửa câu chữ trong JSX:

```jsx
<h1>Tiêu đề muốn hiển thị</h1>
```

Các chuỗi như `courseId`, `holder`, `id` là dữ liệu lấy từ contract, không phải câu chữ có thể thay trong JSX để sửa bản ghi blockchain. Comment `// ...`, `/* ... */` hoặc `{/* ... */}` chỉ giải thích code, không hiện lên giao diện.

## 8. Cấu trúc thư mục

```text
skill-badge-dapp/
├── README.md                    # Hướng dẫn tổng quan này
└── frontend/
    ├── README.md                # Hướng dẫn đọc và sửa mã frontend
    ├── .env                     # Địa chỉ contract, Chain ID
    ├── index.html               # HTML chứa #root
    ├── package.json             # Dependencies và các lệnh npm
    ├── vite.config.js           # Vite + plugin React
    ├── public/                  # File tĩnh, favicon
    ├── scripts/check-sepolia.mjs # Kiểm tra chỉ đọc với contract thật
    ├── docs/ui-validation/      # Ảnh chụp kiểm tra UI, không phải dữ liệu trực tiếp
    └── src/
        ├── main.jsx             # Gắn React vào #root
        ├── App.jsx              # Điều phối state, service và các phần giao diện
        ├── App.css              # Style từng phần và responsive
        ├── index.css            # Design token và style dùng chung
        ├── utils.js             # Helper hiển thị
        ├── components/          # Các phần UI tách riêng
        ├── services/            # Đọc/ghi blockchain, lọc dữ liệu và unit test
        ├── contracts/           # Solidity và ABI đang sử dụng
        └── assets/              # Tài nguyên ảnh có sẵn trong project
```

`node_modules/` chứa dependency; `dist/` là kết quả build được tạo tự động. Sửa mã trong `src/`, không sửa trực tiếp file build trong `dist/`.

## 9. Lưu ý khi kiểm thử

- Không ghi cố định số badge trong tài liệu hoặc JSX: số lượng thay đổi theo giao dịch thật.
- Lỗi RPC hoặc hết giới hạn gọi có thể làm tải collection thất bại; bấm **Refresh registry** để thử lại.
- Giao dịch tạo ở nơi khác chưa tự cập nhật liên tục; dùng **Refresh registry**. Giao dịch thành công từ ứng dụng sẽ tự kích hoạt đọc lại.
- Hệ thống hiện đọc toàn bộ badge; thời gian tải tăng theo số bản ghi. Khi registry lớn cần cân nhắc phân trang hoặc đọc event.
- Font lấy từ Google Fonts, có font dự phòng nếu không tải được; artwork không dùng ảnh từ xa.
- Build có thể cảnh báo bundle lớn do Web3.js; đây là cảnh báo kích thước, không phải lỗi build.
- Build/test không chứng minh luồng ký ví thật đã chạy. Khi kiểm thử giao dịch, cần kiểm tra tài khoản, mạng, thông báo từ chối, receipt và dữ liệu sau giao dịch.

Đọc tiếp: [hướng dẫn mã frontend](frontend/README.md).
