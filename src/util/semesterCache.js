import fs from "fs";

const CACHE_FILE = "data/cache/semesterCache.json";

//reading the semester cache file.
export function readSemesterCache() {
    if (!fs.existsSync(CACHE_FILE)) {
        throw new Error("Semester cache missing - run semester fetch first");
    }

    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}