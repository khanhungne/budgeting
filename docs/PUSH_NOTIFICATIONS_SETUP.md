# Thiết lập thông báo Web Push

Phần mã ứng dụng, migration và Edge Function đã nằm trong repo. Các bước dưới đây cần
thực hiện một lần cho Supabase project `yyvrrfzvhrvecchzzmyt` và Cloudflare Pages.

## 1. Áp dụng migration

Chạy file
[`supabase/migrations/20260902_daily_push_notifications.sql`](../supabase/migrations/20260902_daily_push_notifications.sql)
trong Supabase SQL Editor, hoặc dùng CLI:

```powershell
npx supabase login
npx supabase link --project-ref yyvrrfzvhrvecchzzmyt
npx supabase db push
```

Nếu migration thông báo ngày `20260902` đã được chạy trước khi bản sửa quyền được cập
nhật, chạy thêm
[`supabase/migrations/20260903_notification_table_grants.sql`](../supabase/migrations/20260903_notification_table_grants.sql).

## 2. Cấu hình và deploy Edge Function

Các VAPID keys và cron secret dành cho môi trường hiện tại đã được tạo trong file bị
Git bỏ qua `supabase/.env.local`. Không commit file này.

```powershell
npx supabase secrets set --env-file supabase/.env.local --project-ref yyvrrfzvhrvecchzzmyt
npx supabase functions deploy send-notifications --no-verify-jwt --project-ref yyvrrfzvhrvecchzzmyt
```

`SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase cung cấp tự động cho Edge
Function. Không đưa service-role key hoặc VAPID private key vào frontend.

## 3. Cấu hình Cloudflare Pages

Trong Cloudflare Pages > `budgeting-eyv` > Settings > Variables and Secrets, thêm biến:

```text
VITE_VAPID_PUBLIC_KEY=<giá trị cùng tên trong .env.local>
```

Sau đó deploy lại frontend. Public key này không phải bí mật nhưng phải khớp với cặp
VAPID keys của Edge Function.

## 4. Bật Cron

Mở [`supabase/notification_cron.sql`](../supabase/notification_cron.sql), thay
`YOUR_LONG_RANDOM_CRON_SECRET` bằng `CRON_SECRET` trong `supabase/.env.local`.

Chạy file trong Supabase SQL Editor. Job `send-daily-push-notifications` sẽ gọi Edge
Function mỗi 5 phút; mỗi tài khoản chỉ được claim một lần mỗi ngày và retry tối đa ba
lần nếu gửi thất bại.

Kiểm tra job:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'send-daily-push-notifications';
```

## 5. Kiểm thử trên điện thoại

1. Đăng nhập bằng tài khoản Supabase.
2. Cài PWA lên màn hình chính. iPhone yêu cầu iOS 16.4 trở lên và phải mở app từ icon.
3. Vào Tài khoản > Nhắc ghi thu chi mỗi ngày.
4. Bấm `Bật nhắc nhở` và chấp nhận quyền hệ thống.
5. Bấm `Gửi thử`, sau đó đóng PWA và kiểm tra notification.
6. Chạm notification; ứng dụng phải mở form thêm giao dịch.

Nếu thay VAPID keys, các subscription cũ không còn hợp lệ. Người dùng cần mở app và
bật lại thông báo trên từng thiết bị.
