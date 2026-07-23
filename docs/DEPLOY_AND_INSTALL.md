# Deploy và cài lên màn hình chính

## Build production

```powershell
npm run build
npm run preview
```

Thư mục production được tạo tại `dist`.

## Biến môi trường trên hosting

Tạo đúng hai biến sau trong phần Environment Variables của dịch vụ hosting:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Sau đó build/deploy lại. Đây là publishable key dành cho browser; dữ liệu vẫn phải
được bảo vệ bằng RLS.

## Cài trên Android

1. Mở URL production bằng Chrome.
2. Chọn menu trình duyệt.
3. Chọn **Install app** hoặc **Add to Home screen**.

## Cài trên iPhone/iPad

1. Mở URL production bằng Safari.
2. Nhấn nút **Chia sẻ**.
3. Chọn **Thêm vào MH chính**.
4. Xác nhận tên và chọn **Thêm**.

PWA cần URL HTTPS ở production. `localhost` là ngoại lệ dùng được khi phát triển.
Service worker cache phần giao diện; các thao tác dữ liệu vẫn cần mạng để kết nối
Supabase trong phiên bản đầu.
