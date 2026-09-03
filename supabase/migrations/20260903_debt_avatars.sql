begin;

alter table public.debts
  add column if not exists avatar text;

update public.debts
set avatar = (array[
  '🐣', '🐼', '🦊', '🐸',
  '🐰', '🐻', '🐯', '🐧',
  '🐨', '🐹', '🐶', '🐱',
  '🦁', '🐮', '🐵', '🦄'
])[1 + mod((hashtextextended(lower(btrim(person)), 0) & 2147483647), 16)::integer]
where avatar is null or btrim(avatar) = '';

alter table public.debts
  alter column avatar set default '🐣',
  alter column avatar set not null;

alter table public.debts
  drop constraint if exists debts_avatar_length_check;

alter table public.debts
  add constraint debts_avatar_length_check
  check (char_length(btrim(avatar)) between 1 and 8);

notify pgrst, 'reload schema';

commit;
