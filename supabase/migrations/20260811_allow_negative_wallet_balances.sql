-- Khôi phục flow cho phép ví/ngân hàng có số dư âm.
-- Số dư vẫn được tính từ toàn bộ giao dịch thu/chi.

begin;

drop trigger if exists transactions_nonnegative_wallet_balance
  on public.transactions;
drop function if exists public.enforce_nonnegative_wallet_balance();

notify pgrst, 'reload schema';

commit;
