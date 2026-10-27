-- 会の地域。null は仙台(本拠地)。仙台以外はホットペッパーの中エリア {"code":"Y030","name":"渋谷"}
alter table nomi_parties add column if not exists region jsonb;
