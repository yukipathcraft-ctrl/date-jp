-- 幹事が決める開始時刻(分。19:00 なら 1140)。null は前の会(参加者が「何時から来られるか」を答える)
alter table nomi_parties add column if not exists start_minutes integer;
