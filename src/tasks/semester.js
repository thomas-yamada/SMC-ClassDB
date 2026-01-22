import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const URL = "https://www.smc.edu/academics/classes/dates-deadlines.php";
const CACHE_FILE = "data/cache/semesterCache.json";

//the term index
const TERM_INDEX = {
    winter: "0",
    spring: "1",
    summer: "2",
    fall: "3"
};

//session weeks to ensure we grab the right dates
const SESSION_WEEKS = {
    winter: "6",
    spring: "16",
    summer: "8",
    fall: "16"
}

//grab the UNIX date timestamp for accurate timing.
function nowUnix() {
    return Math.floor(Date.now() / 1000);
}

//parse the date range from the HTML
function parseDateRange(text, year) {
    const match = text.match(
        /([A-Za-z]+ \d{1,2})\s*–\s*([A-Za-z]+ \d{1,2})/
    );
    if (!match) return null;

    return {
        start: Math.floor(new Date(`${match[1]}, ${year}`).getTime() / 1000),
        end: Math.floor(new Date(`${match[2]}, ${year}`).getTime() / 1000)
    };
}

//read the cache from the semester.
function readCache() {
    if (!fs.existsSync(CACHE_FILE)) return null;

    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    } catch {
        return null;
    }
}

//write the semester date to cache
function writeCache(data) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

//scrap the page properly to extract all everything
async function scrapeSemester() {
    const html = (await axios.get(URL)).data;
    const $ = cheerio.load(html);
    const now = nowUnix();

    let result = null;

    $("h2, h3").each((_, heading) => {
        const title = $(heading).text().trim();
        const termMatch = title.match(/(Winter|Spring|Summer|Fall)\s+(\d{4})/i);
        if (!termMatch) return;

        const term = termMatch[1].toLowerCase();
        const year = termMatch[2];
        const requiredWeeks = SESSION_WEEKS[term];

        $(heading).nextUntil("h2, h3").each((_, el) => {
            const text = $(el).text();
            if (!new RegExp(`${requiredWeeks}\\s*-?\\s*week`, "i").test(text)) return;

            const dates = parseDateRange(text, year);
            if (!dates) return;

            if (now >= dates.start && now <= dates.end) {
                result = {
                term: `${termMatch[1]} ${year}`,
                sessionWeeks: requiredWeeks,
                start: dates.start,
                end: dates.end,
                year,
                semesterIndex: TERM_INDEX[term],
                semesterCode: `${year}${TERM_INDEX[term]}`
                };
            }
        });
    });

    if (!result) throw new Error("No active semester found.");

    writeCache(result);
    return result;
}

//initial fetch function.
export async function fetchSemester() {
  const cache = readCache();
  const now = nowUnix();

  if (
    cache &&
    now >= cache.start &&
    now <= cache.end
  ) {
    return cache.semesterIndex;
  }

  const result = await scrapeSemester();
  return result.semesterIndex;
}