import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

import { parseTime } from "../util/parseTime.js"
import { parseLocation } from "../util/parseLocation.js"
import { readSemesterCache } from "../util/semesterCache.js";



 ////// helepers

const stripLabel = (text, label) =>
  text.replace(label, "").trim();

//write the files for the sorted individual buildings.
function writeBuildingFiles(courses) {
  const buildings = new Map();

  for (const course of courses.values()) {
    for (const section of course.sections) {
      const building = section.building || "UNKNOWN";

      if (!buildings.has(building)) {
        buildings.set(building, []);
      }

      buildings.get(building).push({
        code: course.code,
        title: course.title,
        units: course.units,
        ...section
      });
    }
  }

  const sem = readSemesterCache();

  //make the directory if needed.
  fs.mkdirSync(`data/buildings/${sem.semesterCode}`, { recursive: true });

  //sort the buildings into the proper folders.
  for (const [building, sections] of buildings.entries()) {
    fs.writeFileSync(
      `data/buildings/${sem.semesterCode}/${building}.json`,
      JSON.stringify(sections, null, 2),
      "utf8"
    );
  }

  console.log(`Wrote ${buildings.size} building files`);
}

////// main stuff
   
//fetching the classes
export async function fetchClasses() {

  const yearIndex = readSemesterCache();
  const URL = `https://smccis.smc.edu/isisdoc/web_cat_sched_${yearIndex.semesterCode}.html`;

  const { data: html } = await axios.get(URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(html);
  const courses = new Map();

  $("p.course").each((_, el) => {
    const $p = $(el);
    const courseDiv = $p.parents("div[id]").first();
    if (!courseDiv.length) return;

    const courseId = courseDiv.attr("id");

    //if the course was missing, make it.
    if (!courses.has(courseId)) {
      const h3 = courseDiv.find("h3").first();
      if (!h3.length) return;

      const header = h3
        .clone()
        .children("span")
        .remove()
        .end()
        .text()
        .trim();

      const m = header.match(/^(.+?),\s*(.+?)\s+(\d+)\s*units$/);
      if (!m) return;

      courses.set(courseId, {
        code: m[1],
        title: m[2],
        units: Number(m[3]),
        sections: []
      });
    }

    const sectionNum = stripLabel(
      $p.find(".course-number").text(),
      "Course Number:"
    );

    const instructor = stripLabel(
      $p.find(".instructor").text(),
      "Instructor:"
    );

    const timeInfo = parseTime($p.find(".time").text());
    const locInfo = parseLocation($p.find(".location").text());

    const section = {
      section: sectionNum,
      instructor
    };

    Object.assign(section, timeInfo, locInfo);

    if ("arrange_hours" in timeInfo) {
        section.arrange_hours = timeInfo.arrange_hours;
    }

    if (!section.building && !section.room && "arrange_hours" in timeInfo) {
        section.building = "ONLINE";
        section.room = "ONLINE";
    }


    const course = courses.get(courseId);

    if ($p.hasClass("second-line") && course.sections.length) {
        const prev = course.sections.at(-1);

    if ("arrange_hours" in section) {
        prev.arrange_hours = section.arrange_hours;
    }

    if (!prev.start_min && section.start_min) {
        prev.start_min = section.start_min;
        prev.end_min = section.end_min;
        prev.days = section.days;
    }

    if (
        (!prev.building || prev.building === "ONLINE") &&
        section.building &&
        section.building !== "ONLINE"
    ) {
        prev.building = section.building;
        prev.room = section.room;
    }

    } else {
  course.sections.push(section);
}

  });

  const semester = readSemesterCache(); //readSemesterCache();
  const ARCHIVE_PATH = `data/archive/classes_${semester.semesterCode}.json`;

  //write the archive.
  fs.mkdirSync("data/archive", { recursive: true});
  fs.writeFileSync(
    ARCHIVE_PATH,
    JSON.stringify([...courses.values()], null, 2),
    "utf8"
  );

  writeBuildingFiles(courses);

  console.log(`Saved ${courses.size} courses for semester ${semester.term}.`);
}