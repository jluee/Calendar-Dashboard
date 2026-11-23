/* eslint-env node */

/**
 * Generates the initial dummy meeting payload (now → end of next June).
 * Runtime roll-forward (next 6 months after the last meeting) lives in the app.
 */

import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  generateDataset,
  startOfToday,
  endOfNextJune
} from "../src/utils/generateMeetings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const START_DATE = startOfToday();
const END_DATE = endOfNextJune(START_DATE);

const data = generateDataset(START_DATE, END_DATE);
const outputPath = join(__dirname, "..", "public", "data-payload.update.json");
const jsonContent = JSON.stringify(data, null, 2);

try {
  writeFileSync(outputPath, jsonContent, "utf-8");

  if (existsSync(outputPath)) {
    const writtenContent = readFileSync(outputPath, "utf-8");
    if (writtenContent.length > 0) {
      const totalMeetings = data.reduce(
        (sum, member) => sum + member.meetings.length,
        0
      );
      console.log(`✅ Generated dashboard payload: ${outputPath}`);
      console.log(`   Range: ${START_DATE.toISOString()} → ${END_DATE.toISOString()}`);
      console.log(`   Total members: ${data.length}`);
      console.log(`   Total meetings: ${totalMeetings}`);
      console.log(
        `   File size: ${(writtenContent.length / 1024).toFixed(2)} KB`
      );
    } else {
      console.error("❌ Error: File was written but is empty!");
      process.exit(1);
    }
  } else {
    console.error("❌ Error: File was not created!");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Error writing file:", error.message);
  process.exit(1);
}
