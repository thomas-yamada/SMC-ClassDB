//normalize the time to compensate from different spaces and in different places.
export function normalizeTime(raw) {
  return raw
    .replace(/^Time:/i, "")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

//turn the time into minutes since midnight for easy reading from code.
export function timeToMinutes(str) {
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)/i);
  if (!m) return null;

  let hour = Number(m[1]);
  let min = Number(m[2] || 0);
  const ap = m[3].toLowerCase();

  if (ap === "p.m." && hour !== 12) hour += 12;
  if (ap === "a.m." && hour === 12) hour = 0;

  return hour * 60 + min;
}