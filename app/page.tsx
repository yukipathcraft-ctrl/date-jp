import { CalendarDays, Clock, MapPin, Moon, Wallet } from "lucide-react";
import { CreateForm } from "@/components/CreateForm";
import { SiteHeader } from "@/components/SiteHeader";

const STEPS = [
  { icon: CalendarDays, label: "日にち", text: "行ける日に ○" },
  { icon: Clock, label: "時間", text: "何時から来られるか" },
  { icon: Wallet, label: "予算", text: "出せる上限。誰の額かは出ません" },
  { icon: MapPin, label: "場所", text: "仙台駅前・国分町など" },
  { icon: Moon, label: "いつまで", text: "一次会だけ? 最後まで?" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl pb-16">
        <section className="px-4 pt-10 pb-8">
          <p className="text-sm font-bold text-muted">仙台の学生のための飲み会セッティング</p>
          <h1 className="mt-2 text-[2rem] leading-tight font-extrabold tracking-tight">
            <span className="inline-block">飲み会の幹事、</span>
            <span className="inline-block">URLを貼るだけ</span>
          </h1>
          <p className="mt-4 leading-relaxed text-muted">
            みんなが30秒で答えると、日にちと開始時刻、予算、場所が決まり、合うお店まで出てきます。何時まで残れるかも分かるので、二次会の人数も先に読めます。
          </p>
        </section>

        <section className="border-y border-border bg-surface px-4 py-5">
          <h2 className="text-sm font-bold text-muted">みんなが答えること</h2>
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {STEPS.map(({ icon: Icon, label, text }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3">
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="w-16 shrink-0 font-bold">{label}</span>
                <span className="text-sm text-muted">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 border-y border-border bg-surface px-4 py-6">
          <h2 className="mb-5 text-xl font-extrabold">飲み会を作る</h2>
          <CreateForm />
          <p className="mt-4 text-xs leading-relaxed text-muted">
            登録はいりません。作ると、みんなに送るURLと、幹事だけが使うURLができます。
          </p>
        </section>
      </div>
    </>
  );
}
