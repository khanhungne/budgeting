# Thiết lập Supabase cho Ví Nhỏ

Làm lần lượt các bước dưới đây. Không đưa `Secret key` hoặc `service_role` vào
frontend.

## 1. Tạo tài khoản và project

1. Mở <https://supabase.com/dashboard> và đăng nhập.
2. Chọn **New organization** nếu chưa có organization.
3. Chọn **New project**.
4. Đặt tên, ví dụ `vi-nho`.
5. Tạo và lưu database password ở nơi an toàn. Frontend không sử dụng password này.
6. Chọn region gần phần lớn người dùng rồi tạo project.

## 2. Tạo bảng và RLS

1. Trong project, mở **SQL Editor**.
2. Chọn **New query**.
3. Mở file [`supabase/schema.sql`](../supabase/schema.sql), sao chép toàn bộ SQL.
4. Dán vào SQL Editor và nhấn **Run**.
5. Mở **Table Editor** và kiểm tra đã có tám bảng `wallets`, `transactions`,
   `monthly_budgets`, `categories`, `category_budgets`, `debts`, `lottery_entries` và
   `lottery_limits`.
6. Mở **Database → Views** và kiểm tra có view `wallet_balances`.
7. Mở phần policies của từng bảng và kiểm tra có đủ bốn policy `select`,
   `insert`, `update`, `delete`.

RLS dùng `auth.uid() = user_id`, vì vậy mỗi tài khoản chỉ đọc và sửa được giao
dịch, ví, ngân sách và sổ theo dõi của chính tài khoản đó. Số tiền sử dụng kiểu
số nguyên VND.

Nếu đã từng chạy phiên bản schema cũ, hãy chạy lại toàn bộ file mới. Script có
phần nâng cấp idempotent để thêm index, view tổng hợp số dư và các constraint còn
thiếu.

### Thứ tự nâng cấp project production đang dùng

Nếu không chạy lại toàn bộ `supabase/schema.sql`, hãy chạy lần lượt các migration sau trong
SQL Editor, mỗi file phải báo thành công trước khi sang file tiếp theo:

1. `20260724_transaction_only_balances.sql`
2. `20260811_allow_negative_wallet_balances.sql`
3. `20260811_categories_receipts_debts.sql`
4. `20260811_debt_flow.sql`
5. `20260811_lazy_receipts.sql`
6. `20260811_lottery_schedule_vip_hits.sql`
7. `20260811_shared_category_relations.sql`
8. `20260902_daily_push_notifications.sql`
9. `20260903_notification_table_grants.sql`

Các migration có thể chạy lại an toàn và file cuối cùng yêu cầu giao dịch cùng ngân sách
tham chiếu đến dữ liệu `categories` dùng chung. Không chạy nhiều file đồng thời ở các cửa
sổ SQL Editor khác nhau.

### Nâng cấp từ mô hình số dư ban đầu

Project đã tồn tại có thể chạy riêng file
[`supabase/migrations/20260724_transaction_only_balances.sql`](../supabase/migrations/20260724_transaction_only_balances.sql).
Migration này:

1. Chuyển mỗi `opening_balance` cũ thành một giao dịch **Khoản thu** đúng một lần.
2. Đưa `opening_balance` của ví về `0`.
3. Bắt buộc mọi giao dịch thuộc một ví.
4. Tính số dư chỉ từ giao dịch thu/chi.
5. Cho phép số dư ví âm để giữ flow ghi nhận giao dịch cũ.

Migration chạy trong một transaction; nếu có lỗi, toàn bộ thay đổi được rollback.
Không chạy cả file migration và schema đồng thời trong hai cửa sổ SQL Editor.

Ở giai đoạn MVP không cần làm một trang admin riêng. Supabase Dashboard dùng để
quản trị kỹ thuật; không dùng service key trong frontend và không tạo policy cho
admin đọc toàn bộ dữ liệu tài chính cá nhân.

## 3. Bật đăng nhập email

1. Mở **Authentication → Sign In / Providers**.
2. Mở provider **Email** và giữ **Enable Email provider**.
3. Khi phát triển, có thể tạm tắt **Confirm email** để thử nhanh.
4. Trước khi phát hành thật, nên bật lại **Confirm email**.

Email mặc định của Supabase chỉ phù hợp để thử nghiệm và có giới hạn gửi thấp. Khi
đưa ứng dụng cho nhiều người dùng, cấu hình SMTP riêng trong Authentication.

## 4. Cấu hình URL xác thực

Trong **Authentication → URL Configuration**:

- Khi chạy local:
  - Site URL: `http://localhost:5173`
  - Redirect URLs: thêm `http://localhost:5173/**`
- Khi đã deploy:
  - Site URL: URL production chính xác, ví dụ `https://vi-nho.example.com`
  - Redirect URLs: giữ localhost cho phát triển và thêm URL production.

Các URL này được dùng cho xác nhận email và đặt lại mật khẩu.

## 5. Lấy Project URL và Publishable key

1. Mở nút **Connect** của project hoặc **Project Settings → API Keys**.
2. Sao chép **Project URL**.
3. Sao chép **Publishable key**, thường bắt đầu bằng `sb_publishable_`.
4. Không sao chép `Secret key` vào dự án web.

Tại thư mục `D:\personal`, tạo file `.env.local`:

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Sau khi sửa `.env.local`, phải tắt và chạy lại `npm run dev`.

## 6. Kiểm tra cách ly dữ liệu

1. Đăng ký tài khoản A và thêm một giao dịch.
2. Đăng xuất.
3. Đăng ký tài khoản B.
4. Tài khoản B phải không nhìn thấy giao dịch của A.

Nếu B nhìn thấy dữ liệu của A, dừng phát hành và kiểm tra lại RLS.
