-- 「学生・プライベート・会社」の3つにする。private = 社会人の友達どうしの会(worker は会社の会のまま)
alter table nomi_parties drop constraint if exists nomi_parties_audience_check;
alter table nomi_parties add constraint nomi_parties_audience_check check (audience in ('student', 'private', 'worker'));
