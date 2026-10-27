-- 会がどこから作られたか。'guest' = 前にほかの会で答えたことがある人が作った(招待から幹事が生まれた数を数える)。
-- null = それ以外。誰が作ったかは残さない
alter table nomi_parties add column if not exists via text;
