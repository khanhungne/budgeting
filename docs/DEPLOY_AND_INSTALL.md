# Deploy Cloudflare Pages và cài lên màn hình chính

Ứng dụng là React/Vite static PWA, vì vậy không cần Pages Functions, Worker,
middleware hay `@supabase/ssr`.

## 1. Kiểm tra trước khi deploy

```powershell
npm install
npm test
npm run lint:types
npm run build
npm run preview
```

Build production được tạo tại `dist`. Repo pin Node `22.16.0` bằng
`.node-version`.

Cloudflare Pages tự nhận đây là SPA vì build không có `404.html`, nên không cần
thêm `_redirects`. File `public/_headers` được copy vào build để:

- chống nhúng app trong iframe và tắt các quyền browser không dùng;
- cache lâu các file JS/CSS đã có hash;
- buộc browser kiểm tra lại `index.html`, manifest và service worker.

## 2. Deploy bằng GitHub — khuyến nghị

1. Đảm bảo nhánh `main` đã được push lên GitHub.
2. Trong Cloudflare Dashboard, mở **Workers & Pages**.
3. Chọn **Create application → Pages → Import an existing Git repository**.
4. Kết nối GitHub và chọn repository `khanhungne/budgeting`.
5. Nhập cấu hình build:

| Setting | Giá trị |
| --- | --- |
| Production branch | `main` |
| Framework preset | `React (Vite)` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | để trống |

6. Thêm hai biến cho cả **Production** và **Preview**:

```text
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Không thêm `Secret key`, `service_role`, database password hoặc chuỗi kết nối
Postgres vào Cloudflare frontend.

7. Chọn **Save and Deploy**. Sau khi thành công, app có URL dạng:
   `https://TEN_DU_AN.pages.dev`.

Từ lần sau, mỗi commit mới trên `main` sẽ tự build và deploy. Pull request/nhánh
khác có preview deployment riêng.

## 3. Cập nhật Supabase Auth sau khi có URL

Trong **Supabase → Authentication → URL Configuration**:

- **Site URL**: URL production chính xác, ví dụ
  `https://TEN_DU_AN.pages.dev`.
- **Redirect URLs**:
  - `http://localhost:5173/**`
  - `https://TEN_DU_AN.pages.dev/**`
  - nếu cần đăng nhập trên preview:
    `https://**.TEN_DU_AN.pages.dev/**`

Production nên dùng URL chính xác; wildcard chỉ dành cho preview. Sau khi hoàn
tất E2E, bật lại **Email provider** và **Confirm email** trước khi phát hành.

## 4. Gắn custom domain

1. Mở Pages project → **Custom domains → Set up a custom domain**.
2. Nhập domain/subdomain, ví dụ `vi-nho.example.com`.
3. Chờ Cloudflare tạo DNS và chứng chỉ HTTPS.
4. Đổi Supabase **Site URL** sang custom domain.
5. Thêm redirect chính xác:
   `https://vi-nho.example.com/**`.
6. Deploy lại và kiểm tra đăng ký, xác nhận email, quên mật khẩu.

Không tạo Cache Rule kiểu “Cache Everything” cho toàn site. Pages đã cache static
assets; cache HTML hoặc redirect quá lâu có thể làm người dùng nhận bản PWA cũ.

## 5. Upload thủ công — chỉ dùng khi không kết nối GitHub

Build trên máy với `.env.local` production:

```powershell
npm run build
```

Sau đó vào **Workers & Pages → Create application → Get started → Drag and drop**
và tải thư mục `dist` hoặc file zip chứa nội dung của `dist`.

Cũng có thể dùng Wrangler:

```powershell
npx wrangler pages deploy dist
```

Cloudflare không cho chuyển một Direct Upload project sang Git integration về
sau; muốn tự deploy theo mỗi commit thì nên chọn GitHub ngay từ đầu.

## 6. Checklist sau deploy

- URL production trả HTTPS và mở được trên mobile.
- Đăng ký/đăng nhập, đăng xuất rồi đăng nhập lại thành công.
- Tạo ví, giao dịch, ngân sách và bản ghi lô đề; refresh vẫn còn dữ liệu.
- Tài khoản B không thấy dữ liệu tài khoản A.
- Link xác nhận email và quên mật khẩu quay về đúng domain production.
- DevTools không có lỗi console/network.
- PWA cài được và nhận bản cập nhật sau lần deploy tiếp theo.

## 7. Cài PWA

### Android

1. Mở URL production bằng Chrome.
2. Chọn menu trình duyệt.
3. Chọn **Install app** hoặc **Add to Home screen**.

### iPhone/iPad

1. Mở URL production bằng Safari.
2. Nhấn **Chia sẻ**.
3. Chọn **Thêm vào MH chính**.
4. Xác nhận tên và chọn **Thêm**.

Service worker cache giao diện để mở nhanh; thao tác dữ liệu vẫn cần mạng để kết
nối Supabase.
