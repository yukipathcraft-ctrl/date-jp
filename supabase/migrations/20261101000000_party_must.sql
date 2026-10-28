-- 幹事が「必ず来てほしい」にした人の名前(部長など)。その人が行ける日を先に出す
alter table nomi_parties add column if not exists must_names text[] not null default '{}';
