# Rà soát bản demo

## Đã sửa

- Loại bỏ viền focus lồng nhau trên `input`; giữ focus ring ở đúng khung điều
  khiển và đổi màu vùng chọn văn bản.
- Làm lại bottom navigation để nút thêm không che tab Giao dịch.
- Không gọi API giao dịch/ngân sách/lô đề khi chưa xác định user Supabase.
- Không để trạng thái loading ngân sách bị treo khi chưa đăng nhập.
- Bắt sự kiện cài PWA ngay từ lúc app khởi động, tránh bỏ lỡ trước khi người dùng
  mở trang Tài khoản.
- Trạng thái online/offline cập nhật theo sự kiện mạng thay vì chỉ đọc một lần.
- Chặn tháng rỗng từ `input[type=month]`.
- Kiểm tra số VND là số nguyên an toàn trước khi lưu.
- Bắt lỗi xoá bất đồng bộ để tránh unhandled promise.
- Empty state của danh sách giao dịch phản ánh đúng trường hợp bộ lọc không có
  kết quả.
- Backup demo phiên bản 4 bao gồm giao dịch, ví, ngân sách, hạn mức và sổ lô đề;
  vẫn đọc được backup phiên bản 1–3.
- Giao dịch đã được gắn ví; dữ liệu demo cũ tự chuyển về ví Tiền mặt.
- Thêm xu hướng thu–chi 3/6/12 tháng, kể cả tháng không phát sinh giao dịch.
- Thêm hạn mức tiền vào lô đề theo tháng và bộ lọc miền/đài.
- Bổ sung 8 unit test cho định dạng VND, biên tháng, danh sách đài, thống kê lô
  đề và tổng hợp nhiều tháng.

## Giới hạn còn lại

- Demo dùng `localStorage`, không đồng bộ giữa thiết bị và có thể mất nếu người
  dùng xoá dữ liệu trình duyệt.
- Chưa có cơ chế tự chuyển dữ liệu local sang Supabase.
- Chế độ Supabase cần chạy schema mới nhất trước khi sử dụng các module mới.
- Đã smoke-test bố cục ở viewport mobile 390 px; vẫn cần kiểm thử end-to-end trên
  nhiều trình duyệt và thiết bị thật trước khi phát hành rộng.
