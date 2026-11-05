# Date(飲み会セッティング)

https://date-jp.vercel.app

幹事が候補の日を選んでURLをLINEに貼り、みんなが30秒で答えると、日にち・開始時刻・予算・場所・二次会に残る人数が決まり、合うお店が出る。会計(傾斜・割り勘)、集金のチェック、席決めのくじも同じアプリでできる。ログインは不要。

名前は伊達(だて)から。保存のキーや Vercel のプロジェクト名は、前の名前 nomi のまま。

## 技術
- Next.js 16(App Router)+ React 19 + TypeScript + Tailwind CSS v4
- Supabase(Postgres)。`.env.local` がなければメモリ上の仮DBで動く
- お店: ホットペッパーグルメ Webサービス / 駅: HeartRails Express
- デプロイ: Vercel(東京 `hnd1`)
- テスト: Vitest

## 決め方(`lib/summary.ts`)
- 日にち: 「行ける」が多い日。同じなら「たぶん」が多い日、さらに同じなら早い日。幹事が「必ず来てほしい人」を選ぶと、その人が行ける日を先にする
- 開始時刻: 幹事が決める
- 一次会: 開始から2時間(飲み放題に合わせる)。それより遅くまで残れる人を二次会に数える
- 予算: 行く人全員が出せる額(いちばん低い上限)。誰がいくらと答えたかは、幹事にも出さない
- 場所: 参加者がそれぞれ「行きやすい駅」を全国から1つ選ぶ。行く人の駅のうち、全員の駅までの距離の合計がいちばん短い駅を「集まりやすい駅」にして、その近くでお店を探す(`lib/stations.ts`)

## ログインなしの認可
- 幹事: 会を作るときに推測できない鍵を発行し、DBにはハッシュだけを保存する。決定などはサーバー側で鍵を照らし合わせる(`app/actions.ts`)
- 参加者: 回答ごとに鍵を発行してブラウザに保存し、本人だけが回答を直せる

## お金の稼ぎ方
お店のページへは必ず `/go/{飲み会}/{お店}` を通し、押された数を `nomi_shop_clicks` に残す。
`AFFILIATE_URL_TEMPLATE` に送客の手数料が付くリンクの形を入れると、そのリンクで飛ばす。
ほかに、見返りなしの応援(OFUSE)のリンクを `SUPPORT_URL` で置く。

## 動かす
- `npm run dev` 開発サーバー(`.env.local` がなければメモリ上の仮DB)
- `npm test` / `npm run lint` / `npm run build`
- お店: `HOTPEPPER_API_KEY` があればホットペッパーグルメから実際のお店を出す。なければ見本(実在しない)
- DB: `supabase/migrations/` を Supabase の SQL Editor で実行し、`SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を入れる
