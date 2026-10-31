import { isFormal, type Audience } from "./audience";

// 乾杯と締めの挨拶。決まった会の名前から場面(忘年会・送別会など)を見て、学生・プライベートは話し言葉、会社は敬語で作る。
// 「別の案」で、言い回しと場面の一言の組み合わせを順に変える

export type GreetingKind = "kanpai" | "shime";

export type Occasion = "none" | "bonenkai" | "shinnenkai" | "sobetsu" | "kangei" | "kansougei" | "uchiage" | "birthday";

/** 場面を選ぶボタンに並べる順と名前 */
export const OCCASIONS: { key: Occasion; label: string }[] = [
  { key: "none", label: "いつもの" },
  { key: "bonenkai", label: "忘年会" },
  { key: "shinnenkai", label: "新年会" },
  { key: "sobetsu", label: "送別会" },
  { key: "kangei", label: "歓迎会" },
  { key: "kansougei", label: "歓送迎会" },
  { key: "uchiage", label: "打ち上げ" },
  { key: "birthday", label: "誕生日" },
];

/** 会の名前から場面を見る。どれにも当たらなければ none */
export function occasionFromTitle(title: string): Occasion {
  const t = title.replace(/\s/g, "");
  if (/歓送迎/.test(t)) return "kansougei";
  if (/忘年/.test(t)) return "bonenkai";
  if (/新年/.test(t)) return "shinnenkai";
  if (/送別|追いコン|卒業|お別れ|壮行|送る会/.test(t)) return "sobetsu";
  if (/歓迎|新歓|新入|入社|ようこそ/.test(t)) return "kangei";
  if (/打ち?上げ|お?疲れ|おつかれ|慰労|祝勝/.test(t)) return "uchiage";
  if (/誕生|バースデー|バースデイ|birthday/i.test(t)) return "birthday";
  return "none";
}

type Lines = { kanpai: string[]; shime: string[] };

/** 場面ごとの一言。casual は学生・プライベート、formal は会社 */
const LINES: Record<Occasion, { casual: Lines; formal: Lines }> = {
  none: {
    casual: {
      kanpai: ["今日は時間を作ってくれてありがとう!", "このメンバーで集まれてうれしい!"],
      shime: ["また近いうちに集まろう!", "次の会も楽しみにしてます!"],
    },
    formal: {
      kanpai: ["本日はお忙しい中、お集まりいただきありがとうございます。", "日頃の感謝を込めて、本日は楽しい時間にできればと思います。"],
      shime: ["今後とも、どうぞよろしくお願いいたします。", "明日からも、またよろしくお願いいたします。"],
    },
  },
  bonenkai: {
    casual: {
      kanpai: ["今年も一年、おつかれさま!", "今年もいろいろあったけど、みんなのおかげで楽しい一年でした!"],
      shime: ["来年もこのメンバーでよろしく!", "みんな、いい年越しを!"],
    },
    formal: {
      kanpai: ["本年も一年間、大変お疲れさまでした。", "今年一年、皆さまのおかげで無事にここまで来ることができました。"],
      shime: ["来年も皆さまにとって良い年になりますように。", "来年も引き続き、よろしくお願いいたします。"],
    },
  },
  shinnenkai: {
    casual: {
      kanpai: ["あけましておめでとう!今年もよろしく!", "今年もこのメンバーで楽しくいこう!"],
      shime: ["今年もいい一年にしよう!", "今年もたくさん集まろう!"],
    },
    formal: {
      kanpai: ["新年あけましておめでとうございます。", "本年も、どうぞよろしくお願いいたします。"],
      shime: ["本年が皆さまにとって実り多き一年となりますように。", "今年も一丸となって、良い一年にしていきましょう。"],
    },
  },
  sobetsu: {
    casual: {
      kanpai: ["今日は門出のお祝い!これまで本当にありがとう!", "新しい場所に行っても、ずっと仲間です!"],
      shime: ["離れてもまた集まろう!", "新しい場所でもがんばってね!"],
    },
    formal: {
      kanpai: ["本日は、新たな門出を迎える方への感謝を込めて集まりました。", "これまでのご尽力に、心より感謝申し上げます。"],
      shime: ["新天地でのますますのご活躍をお祈りいたします。", "今後のご健勝とご活躍を、心よりお祈りいたします。"],
    },
  },
  kangei: {
    casual: {
      kanpai: ["新しい仲間、ようこそ!", "新しいメンバーも入って、これからもっと楽しくなりそう!"],
      shime: ["これからよろしく!", "これからたくさん思い出をつくろう!"],
    },
    formal: {
      kanpai: ["本日は、新しく仲間に加わった方を歓迎する会です。", "新しい仲間を迎え、ますますにぎやかになりました。"],
      shime: ["これから、どうぞよろしくお願いいたします。", "新しい仲間とともに、より良いチームにしていきましょう。"],
    },
  },
  kansougei: {
    casual: {
      kanpai: ["今日は、旅立つ人と新しく来た人、どっちもお祝い!", "出会いと門出が重なる、特別な日です!"],
      shime: ["行く人はがんばって、来た人はこれからよろしく!", "離れても、これからも、ずっと仲間です!"],
    },
    formal: {
      kanpai: ["本日は、新たな門出を迎える方と、新しく加わった方をお迎えする会です。", "出会いと門出が重なる、節目の日となりました。"],
      shime: ["旅立つ方のご活躍と、新しい仲間の今後をお祈りいたします。", "それぞれの場所での、ますますのご活躍をお祈りいたします。"],
    },
  },
  uchiage: {
    casual: {
      kanpai: ["まずはみんな、本当におつかれさま!", "最後までやりきったね!"],
      shime: ["またみんなで集まろう!", "最高のメンバーでした!"],
    },
    formal: {
      kanpai: ["まずは皆さま、本当にお疲れさまでした。", "皆さまのご尽力のおかげで、無事に終えることができました。"],
      shime: ["この経験を、次にも生かしていきましょう。", "次も、このメンバーで良い結果を出しましょう。"],
    },
  },
  birthday: {
    casual: {
      kanpai: ["今日は誕生日のお祝い!おめでとう!", "おめでたい日に、みんなで集まれてうれしい!"],
      shime: ["素敵な一年になりますように!", "また来年もお祝いしよう!"],
    },
    formal: {
      kanpai: ["本日は、おめでたい日のお祝いです。", "おめでたい日に、皆さまとお祝いできることをうれしく思います。"],
      shime: ["素晴らしい一年となりますよう、お祈りいたします。", "ますますのご健康とご活躍をお祈りいたします。"],
    },
  },
};

/** 言い回しの型。{line} に場面の一言、{title} に会の名前が入る */
const TEMPLATES: Record<Audience, Record<GreetingKind, string[][]>> = {
  student: {
    kanpai: [
      ["みんな、飲み物持った?", "{line}", "今日は時間いっぱい楽しもう!", "それじゃあ、乾杯!"],
      ["ちょっとだけいいですか!", "{line}", "堅いのはなしで、今日は楽しくいきましょう!", "グラスを持って…乾杯!"],
      ["{title}、始めます!", "{line}", "飲める人も飲めない人も、楽しんでいこう!", "せーの、乾杯!"],
    ],
    shime: [
      ["そろそろお開きの時間です!", "{line}", "忘れ物しないように!", "今日はありがとうございました!"],
      ["盛り上がってるところすみません、そろそろ締めます!", "{line}", "最後は一本締めで!", "いよーっ、パン!", "ありがとうございました!"],
      ["宴もたけなわですが、そろそろお時間です!", "{line}", "帰り道、気をつけて!おつかれさまでした!"],
    ],
  },
  private: {
    kanpai: [
      ["それでは、乾杯の前にひとこと。", "{line}", "今日はゆっくり楽しみましょう。", "それでは、乾杯!"],
      ["ちょっとだけ、ひとこと。", "{line}", "料理もお酒も、たっぷり楽しもう。", "グラスを持って、乾杯!"],
      ["{title}、始めます。", "{line}", "今日は仕事のことは忘れて、楽しい時間に。", "乾杯!"],
    ],
    shime: [
      ["そろそろお開きにしようか。", "{line}", "今日は来てくれてありがとう。気をつけて帰ってね。"],
      ["名残惜しいけど、そろそろ時間です。", "{line}", "最後に一本締めでしめましょう。", "いよーっ、パン!", "おつかれさまでした!"],
      ["宴もたけなわですが、このへんで。", "{line}", "帰り道、気をつけて。またね!"],
    ],
  },
  worker: {
    kanpai: [
      ["僭越ながら、乾杯の音頭を取らせていただきます。", "{line}", "本日はどうぞ肩の力を抜いて、楽しいひとときをお過ごしください。", "それでは、皆さまのご健康とご活躍を祈念しまして、乾杯!"],
      ["皆さま、お手元にグラスはございますでしょうか。", "{line}", "短いですが、ごあいさつに代えさせていただきます。", "それでは、ご唱和をお願いいたします。乾杯!"],
      ["それでは、{title}を始めさせていただきます。", "{line}", "今後のさらなる発展を祈念いたしまして、乾杯!"],
    ],
    shime: [
      ["宴もたけなわではございますが、そろそろお時間となりました。", "{line}", "それでは、一本締めで締めさせていただきます。", "お手を拝借。いよーっ、パン!", "ありがとうございました。"],
      ["皆さま、本日は誠にありがとうございました。", "{line}", "最後は三本締めで締めたいと思います。", "お手を拝借。いよーっ!", "(パパパン パパパン パパパン パン ×3)", "ありがとうございました。"],
      ["名残惜しいところではございますが、これにてお開きとさせていただきます。", "{line}", "どうぞお気をつけてお帰りください。"],
    ],
  },
};

/** 案の数(言い回しの型 × 場面の一言) */
export function variantCount(kind: GreetingKind, audience: Audience, occasion: Occasion): number {
  const lines = LINES[occasion][isFormal(audience) ? "formal" : "casual"][kind];
  return TEMPLATES[audience][kind].length * lines.length;
}

/** 挨拶の文。variant は 0 から。案の数を超えたら最初に戻る */
export function greeting({
  kind,
  audience,
  occasion,
  title,
  variant = 0,
}: {
  kind: GreetingKind;
  audience: Audience;
  occasion: Occasion;
  title: string;
  variant?: number;
}): string {
  const templates = TEMPLATES[audience][kind];
  const lines = LINES[occasion][isFormal(audience) ? "formal" : "casual"][kind];
  const n = templates.length * lines.length;
  const v = ((variant % n) + n) % n;
  // 型を先に回し、一周したら場面の一言を変える
  let template = templates[v % templates.length];
  const line = lines[Math.floor(v / templates.length) % lines.length];
  const name = title.trim();
  // 会の名前がないときは、名前を使う型の代わりに最初の型にする
  if (!name && template.some((t) => t.includes("{title}"))) template = templates[0];
  return template.map((t) => t.replace("{line}", line).replace("{title}", name)).join("\n");
}
