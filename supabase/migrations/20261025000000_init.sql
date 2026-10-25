-- 飲み会と回答。ブラウザから直接は読み書きさせない(サーバーが service role で読む)

create table parties (
  id text primary key,
  title text not null check (char_length(title) between 1 and 40),
  dates text[] not null,
  admin_hash text not null,
  decision jsonb,
  created_at timestamptz not null default now()
);

create table answers (
  id uuid primary key,
  party_id text not null references parties (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  token_hash text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (party_id, name)
);

-- お店のページへ飛んだ数。送客の手数料を確かめるために数える(誰が押したかは残さない)
create table shop_clicks (
  id bigint generated always as identity primary key,
  party_id text not null references parties (id) on delete cascade,
  shop_id text not null,
  created_at timestamptz not null default now()
);

alter table parties enable row level security;
alter table answers enable row level security;
alter table shop_clicks enable row level security;
