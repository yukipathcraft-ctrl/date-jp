-- 広告枠が見られた数と押された数。広告主に月の実績を見せるために数える(誰が見たかは残さない)
-- ブラウザから直接は読み書きさせない(サーバーが service role で書く)

create table nomi_ad_events (
  id bigint generated always as identity primary key,
  sponsor_id text not null,
  -- view = 画面に出た、click = 押された
  kind text not null check (kind in ('view', 'click')),
  created_at timestamptz not null default now()
);

create index nomi_ad_events_created_at on nomi_ad_events (created_at);

alter table nomi_ad_events enable row level security;
