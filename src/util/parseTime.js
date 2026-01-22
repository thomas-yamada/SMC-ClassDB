import { parseDays } from "./parseDays.js"
import { normalizeTime, timeToMinutes } from "./timeUtils.js"

//extract the hours from "arrange"
export function extractArrangedHours(text) {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/i);
  return m ? Number(m[1]) : null;
}

//parse the time from the HTML
export function parseTime(raw) {
  if (!raw) return {};

  raw = normalizeTime(raw);

  // ONLINE / ARRANGED
  if (/ONLINE|Arrange/i.test(raw)) {
    return {
      arrange_hours: extractArrangedHours(raw)
    };
  }

  const m = raw.match(
    /(.+?)\s-\s(.+?)(?:\s([UMTWThFS]+))?$/
  );
  if (!m) return {};

  const [, startStr, endStr, dayStr] = m;

  return {
    start_min: timeToMinutes(startStr),
    end_min: timeToMinutes(endStr),
    days: dayStr ? parseDays(dayStr) : []
  };
}