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
- Tổng hợp thu, chi và số dư theo tháng.
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

Xem hướng dẫn deploy và cài app tại
[`docs/DEPLOY_AND_INSTALL.md`](docs/DEPLOY_AND_INSTALL.md).
