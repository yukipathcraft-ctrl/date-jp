// 決まった会をカレンダーに入れる。Google カレンダーのリンクと、iPhone などで開く .ics の中身を作る。純粋関数。
// 連絡先を集めずに、前日などのお知らせを各自のカレンダーに任せる(Date から通知は送らない)

import { FIRST_PARTY_MINUTES } from "./sendai";

export type CalendarEvent = {
  title: string;
  /** YYYY-MM-DD(日本時間) */
  date: string;
  /** 開始(日本時間の0時からの分。24時を超えることもある) */
  start: number;
  /** お店の名前など。なければ空 */
  location?: string | null;
  /** 会のページ */
  url: string;
};

/** 日本時間の日付と分から、UTC の「YYYYMMDDTHHMMSSZ」を作る */
function utcStamp(date: string, minutes: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d, 0, minutes) - 9 * 60 * 60 * 1000;
  return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Google カレンダーの「予定を作る」画面を開く URL。一次会の長さ(2時間)で入れる */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${utcStamp(e.date, e.start)}/${utcStamp(e.date, e.start + FIRST_PARTY_MINUTES)}`,
    details: e.url,
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** iCalendar の文字のうち、意味のある記号を逃がす */
function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** .ics の中身。前日の同じ時刻に知らせる(カレンダーのアプリが通知する) */
export function icsContent(e: CalendarEvent, uid: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Date//nomikai//JA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utcStamp(e.date, e.start)}`,
    `DTEND:${utcStamp(e.date, e.start + FIRST_PARTY_MINUTES)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    ...(e.location ? [`LOCATION:${escapeIcs(e.location)}`] : []),
    `DESCRIPTION:${escapeIcs(e.url)}`,
    `URL:${e.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(`明日 ${e.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
