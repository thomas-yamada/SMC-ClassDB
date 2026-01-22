import { sleep } from "./util/sleep.js"
import { fetchClasses } from "./tasks/classes.js"
import { fetchSISessions } from "./tasks/si.js";
import { fetchAppointments } from "./tasks/appointments.js";
import { fetchSemester } from "./tasks/semester.js";
import fs from "fs";

let lastAppointments = 0;
let lastClasses = 0;

//if the state.json file exists, set the variables to the unix value by default instead of starting from 0.
if (fs.existsSync("state.json")) {
    const saved = JSON.parse(fs.readFileSync("state.json", "utf8"));
    lastClasses = saved.lastClasses ?? 0;
    lastAppointments = saved.lastAppointments ?? 0;
}

const FIFTEEN_MIN = 15*60*1000;
const TWO_DAYS = 2*24*60*60*1000;

//if the semesterCache doesnt exist yet, fetch semester to grab the data.
await fetchSemester();
console.log("fetch sem");

console.log("Runner started!");

//every 60 seconds, it runs through the loop, every 15 minutes it grabs appointments and every two days it grabs SI and classes, to keep working between semesters.
while (true) {
    const now = Date.now();

    if (now - lastAppointments >= FIFTEEN_MIN) {
        console.log("Started appointment Fetch");
        await fetchAppointments();
        lastAppointments = Date.now();
        console.log("Finished appointment fetch.");
    }

    if (now - lastClasses >= TWO_DAYS) {
        console.log("Started classes fetch.");
        const semester = await fetchSemester();
        console.log("between sem and class");
        await fetchClasses(semester);
        console.log("fetchclasses");
        await fetchSISessions(semester);
        lastClasses = Date.now();
        console.log("Finished classes fetch.");
    }

    //update state.json
    fs.writeFileSync("state.json", JSON.stringify({ lastClasses, lastAppointments }, null, 2));

    await sleep(60_000);
}