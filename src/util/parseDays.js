//parse the days from the HTML
export function parseDays(str) {
  if (!str) return [];

  const tokens = [];
  let i = 0;

  while (i < str.length) {
    //check the two letter days first
    if (str.startsWith("Th", i)) {
      tokens.push("Th");
      i += 2;
      continue;
    }

    const ch = str[i];
    if (["U", "M", "T", "W", "F", "S"].includes(ch)) {
      tokens.push(ch);
      i += 1;
      continue;
    }

    //skin unexpecteds
    i += 1;
  }

  return tokens;
}