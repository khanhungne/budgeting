# Ví Nhỏ

PWA mobile-first để quản lý thu chi cá nhân. Frontend dùng React, Vite,
TypeScript và Tailwind CSS. Ứng dụng mặc định chạy demo bằng `localStorage`;
khi thêm biến môi trường, ứng dụng chuyển sang Supabase Auth + PostgreSQL.

Tất cả số tiền được nhập, lưu và hiển thị theo **VND**, không sử dụng phần thập
phân.

## Công nghệ

- React + TypeScript
- Vite
- Tailwind CSS v4
- Supabase Auth + PostgreSQL + RLS
- vite-plugin-pwa

## Cấu trúc chính

```text
src/
├── app/                  # Ghép các màn hình ở cấp ứng dụng
├── components/
│   ├── layout/           # Khung app và bottom navigation
│   ├── pwa/              # Cập nhật/cài PWA
│   └── ui/               # Component giao diện dùng lại
├── features/
│   ├── auth/             # Auth provider và màn hình đăng nhập
│   ├── budgets/          # Ngân sách chi tiêu theo tháng
│   ├── lottery/          # Sổ theo dõi, hạn mức, miền và đài
│   ├── transactions/     # API, hook, type và UI giao dịch
│   └── wallets/          # Ví tiền mặt/ngân hàng/ví điện tử
├── hooks/                # Hook dùng chung
├── lib/                  # Supabase, ngày tháng, định dạng tiền
└── pages/                # Các màn hình Tổng quan/Giao dịch/Tài khoản
```

## Chạy demo local

```powershell
npm install
npm run dev
```

Mở <http://localhost:5173>. Không cần tài khoản hoặc cấu hình Supabase. Bản demo
tự tạo một ít dữ liệu mẫu; các thay đổi được giữ trong `localStorage` của trình
duyệt hiện tại.

## Chức năng hiện có

- Thêm, sửa và xoá khoản thu/chi theo VND.
- Quản lý nhiều ví/tài khoản và tự tính số dư từng ví.
- Hiển thị tổng số dư hiện tại và biến động thu–chi theo tháng.
- Đặt ngân sách tháng và theo dõi mức đã sử dụng.
- Tìm kiếm theo ghi chú/danh mục và lọc thu/chi.
- Phân bổ khoản chi theo danh mục.
- Thống kê tỷ lệ tiết kiệm, chi trung bình/ngày, danh mục, nhịp chi tiêu và
  xu hướng thu–chi 3/6/12 tháng.
- Sổ lô đề ghi chép thủ công với miền, đài, tiền vào, tiền nhận, kết quả và
  thống kê lãi/lỗ.
- Danh sách đài theo ba miền, bộ lọc miền/đài và hạn mức tiền vào tự đặt theo
  tháng.
- Lọc giao dịch theo khoảng ngày và chuyển thống kê giữa cả tháng/một ngày.
- Xuất và nhập backup JSON trong chế độ demo.
- Cài lên màn hình chính dưới dạng PWA.
- Tải màn hình và dữ liệu theo nhu cầu; số dư ví được tổng hợp tại PostgreSQL khi
  dùng Supabase.

Phần lô đề chỉ dùng để ghi chép và kiểm soát tiền, không dự đoán kết quả, soi cầu
hoặc kết nối dịch vụ đặt cược.

## Luồng sử dụng và cách tính số dư

### 1. Đăng ký hoặc đăng nhập

Khi dùng Supabase, mỗi tài khoản chỉ đọc và thay đổi dữ liệu của chính mình nhờ
Row Level Security (RLS). Sau lần đăng nhập đầu tiên, ứng dụng tự tạo một ví tiền
mặt mặc định nếu tài khoản chưa có ví.

### 2. Khai báo ví và số dư ban đầu

Vào **Tài khoản → Ví và tài khoản** để sửa ví mặc định hoặc tạo thêm ví ngân
hàng, tiền mặt và ví điện tử.

**Số dư ban đầu** là số tiền thực tế đang có trong ví tại thời điểm bắt đầu dùng
ứng dụng. Không nhập lại khoản này thành một giao dịch thu, nếu không số tiền sẽ
bị cộng hai lần.

### 3. Ghi nhận giao dịch

Khi thêm một giao dịch, chọn:

- **Tiền vào** khi nhận lương, được hoàn tiền hoặc có khoản thu khác.
- **Tiền ra** khi mua sắm, thanh toán hoá đơn hoặc có khoản chi khác.
- Ví nhận tiền hoặc chi tiền tương ứng.
- Ngày, danh mục và ghi chú của giao dịch.

Thêm, sửa hoặc xoá giao dịch sẽ cập nhật lại số dư của ví và tổng số dư trên
trang chủ.

### 4. Hiểu các con số trên trang chủ

**Tổng số dư hiện tại** sử dụng toàn bộ lịch sử giao dịch của các ví đang hoạt
động:

```text
Tổng số dư hiện tại
= tổng số dư ban đầu của các ví
+ toàn bộ tiền vào
− toàn bộ tiền ra
```

Ví đã lưu trữ vẫn giữ dữ liệu nhưng không được cộng vào tổng số dư trang chủ.
Khôi phục ví để đưa số dư của ví đó trở lại tổng.

**Biến động tháng**, **Tiền vào** và **Tiền ra** chỉ tính các giao dịch thuộc
tháng đang chọn:

```text
Biến động tháng = Tiền vào trong tháng − Tiền ra trong tháng
```

Ví dụ: ví có số dư ban đầu `5.000.000 ₫`, sau đó nhận `10.000.000 ₫` và chi
`2.000.000 ₫`. Trang chủ hiển thị tổng số dư hiện tại `13.000.000 ₫`; biến động
tháng là `8.000.000 ₫`.

Ngân sách tháng chỉ so sánh hạn mức với **Tiền ra** trong tháng. Màn hình Thống
kê cũng phân tích giao dịch theo tháng hoặc khoảng thời gian được chọn.

### 5. Luồng dữ liệu Supabase

```text
Localhost hoặc Cloudflare Pages
        ↓
Supabase Auth xác định tài khoản
        ↓
RLS giới hạn dữ liệu theo tài khoản
        ↓
PostgreSQL lưu ví, giao dịch, ngân sách và sổ ghi chép
        ↓
View wallet_balances tính số dư từng ví
        ↓
Ứng dụng cộng các ví đang hoạt động và hiển thị trên trang chủ
```

Localhost và bản Cloudflare Pages cùng dùng một Supabase project nếu được cấu
hình cùng URL/key. Vì vậy thay đổi ở local cũng xuất hiện trên production.

PWA có thể mở giao diện đã được cache khi mất mạng, nhưng chế độ Supabase hiện
cần Internet để tải hoặc lưu thay đổi. Ứng dụng chưa có hàng đợi ghi offline để
tự đồng bộ lại khi có mạng.

## Chuyển sang Supabase sau

1. Làm theo [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).
2. Chạy [`supabase/schema.sql`](supabase/schema.sql) trong SQL Editor.
3. Sao chép `.env.example` thành `.env.local`.
4. Điền Project URL và Publishable key.
5. Khởi động lại `npm run dev`.

Khi `.env.local` hợp lệ, app tự tắt demo mode và hiển thị đăng ký/đăng nhập
Supabase. Dữ liệu demo hiện chưa tự chuyển vào cloud.

## Thiết lập Supabase

Sau khi kết nối, đăng ký hai tài khoản khác nhau để kiểm tra RLS trước khi phát
hành.

## Các lệnh

```powershell
npm run dev                 # Development server
npm run lint:types          # Kiểm tra TypeScript
npm test                    # Chạy unit test tự động
npm run build               # Build production + PWA
npm run preview             # Xem bản production local
```

Xem hướng dẫn deploy Cloudflare Pages, cấu hình Supabase production và cài app tại
[`docs/DEPLOY_AND_INSTALL.md`](docs/DEPLOY_AND_INSTALL.md).
