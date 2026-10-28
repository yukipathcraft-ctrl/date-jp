-- 回答の締め切り(その日の終わりまで。日本時間)。null は締め切りなし
alter table nomi_parties add column if not exists answer_deadline date;
