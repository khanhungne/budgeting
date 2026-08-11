begin;
alter table public.transactions add column if not exists receipt_attached boolean not null default false;
update public.transactions set receipt_attached = (receipt_image is not null) where receipt_attached is distinct from (receipt_image is not null);
notify pgrst, 'reload schema';
commit;
