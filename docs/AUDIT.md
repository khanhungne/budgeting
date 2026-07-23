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
- Chỉ tải code Supabase khi thực sự cấu hình cloud; bản demo không còn phải parse
  SDK Supabase lúc khởi động.
- Lazy-load bốn màn hình phụ và chỉ gọi API lô đề, hạn mức, ngân sách, xu hướng
  hoặc số dư ví khi tab tương ứng được mở.
- Xu hướng nhiều tháng tái sử dụng giao dịch của tháng hiện tại, không tải trùng.
- View `wallet_balances` tổng hợp số dư trong PostgreSQL; frontend không còn phải
  tải toàn bộ lịch sử giao dịch chỉ để tính số dư.
- Thêm index cho quan hệ ví–giao dịch, ràng buộc ví và giao dịch cùng chủ sở hữu,
  giới hạn số VND theo `Number.isSafeInteger` và kiểm tra định dạng số lô ở DB.
- Chặn response cũ ghi đè dữ liệu mới khi đổi tháng hoặc thao tác lưu quá nhanh.
- Chỉ chọn các cột cần dùng trong Data API và loại bỏ màn hình cấu hình không còn
  được tham chiếu.

## Giới hạn còn lại

- Demo dùng `localStorage`, không đồng bộ giữa thiết bị và có thể mất nếu người
  dùng xoá dữ liệu trình duyệt.
- Chưa có cơ chế tự chuyển dữ liệu local sang Supabase.
- Chế độ Supabase cần chạy schema mới nhất trước khi sử dụng các module mới.
- Chưa có dữ liệu production để chạy `EXPLAIN ANALYZE`; sau khi có lượng dữ liệu
  thực nên xem Query Performance Advisor trước khi thêm index mới.
- Đã smoke-test bố cục ở viewport mobile 390 px; vẫn cần kiểm thử end-to-end trên
  nhiều trình duyệt và thiết bị thật trước khi phát hành rộng.
