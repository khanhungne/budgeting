begin;

create table if not exists public.categories (
  id text not null check (char_length(id) between 1 and 40),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 18),
  emoji text not null default '📌',
  kind text not null check (kind in ('expense', 'income')),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

-- Nâng cấp an toàn nếu phiên bản trước đã tạo custom_categories.
do $$
begin
  if to_regclass('public.custom_categories') is not null then
    execute 'insert into public.categories (id,user_id,label,emoji,kind,color,created_at,updated_at)
      select id,user_id,label,emoji,kind,color,created_at,updated_at from public.custom_categories
      on conflict (id,user_id) do update set label=excluded.label,emoji=excluded.emoji,kind=excluded.kind,color=excluded.color';
  end if;
end $$;

-- Mỗi tài khoản có bộ danh mục mặc định của riêng mình; sau đó có thể sửa/xóa như dữ liệu thường.
insert into public.categories (id, user_id, label, emoji, kind, color)
select defaults.id, users.id, defaults.label, defaults.emoji, defaults.kind, defaults.color
from auth.users as users
cross join (values
  ('food','Ăn uống','🍜','expense','#ef8f67'),
  ('transport','Đi lại','🛵','expense','#6fa8dc'),
  ('shopping','Mua sắm','🛍️','expense','#bf8ed8'),
  ('bills','Hoá đơn','🧾','expense','#e6b85c'),
  ('health','Sức khoẻ','💊','expense','#e67b88'),
  ('education','Học tập','📚','expense','#6ab5a1'),
  ('fun','Giải trí','🎮','expense','#778bd4'),
  ('other-expense','Khác','📦','expense','#9aa19d'),
  ('salary','Lương','💼','income','#4ca77b'),
  ('bonus','Thưởng','🎁','income','#71b45d'),
  ('investment','Đầu tư','📈','income','#3e91a3'),
  ('other-income','Thu khác','💰','income','#72a96b')
) as defaults(id,label,emoji,kind,color)
on conflict (id,user_id) do nothing;

-- Giữ được mọi category id cũ không nằm trong bộ mặc định.
insert into public.categories (id,user_id,label,emoji,kind,color)
select tx.category, tx.user_id, left(tx.category,18), '📌', min(tx.kind),
  case when min(tx.kind) = 'income' then '#059669' else '#d97706' end
from public.transactions tx
left join public.categories category on category.id=tx.category and category.user_id=tx.user_id
where category.id is null
group by tx.category, tx.user_id
on conflict (id,user_id) do nothing;

alter table public.transactions drop constraint if exists transactions_category_owner_fkey;
alter table public.transactions add constraint transactions_category_owner_fkey
  foreign key (category,user_id) references public.categories(id,user_id) on delete restrict;
alter table public.category_budgets drop constraint if exists category_budgets_category_owner_fkey;
alter table public.category_budgets add constraint category_budgets_category_owner_fkey
  foreign key (category,user_id) references public.categories(id,user_id) on delete restrict;

alter table public.categories enable row level security;
grant select,insert,update,delete on public.categories to authenticated;
drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories for all to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

commit;
