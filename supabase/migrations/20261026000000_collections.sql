-- 傾斜会計の集金。参加した人は URL から自分の「払った」を押し、幹事は鍵の入った URL で受け取りを記録する
-- ブラウザから直接は読み書きさせない(サーバーが service role で読む)

create table nomi_collections (
  id text primary key,
  admin_hash text not null,
  -- 会計の名前・合計・1人ずつの名前と金額(金額はサーバーで計算し直したもの)
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table nomi_collection_payments (
  collection_id text not null references nomi_collections (id) on delete cascade,
  person_id integer not null,
  -- self = 本人が押した、host = 幹事が受け取りを記録した
  paid_by text not null check (paid_by in ('self', 'host')),
  paid_at timestamptz not null default now(),
  primary key (collection_id, person_id)
);

alter table nomi_collections enable row level security;
alter table nomi_collection_payments enable row level security;
