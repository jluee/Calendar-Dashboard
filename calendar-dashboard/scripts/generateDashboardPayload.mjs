// scripts/generateDashboardPayload.mjs

const owners = [
  { owner: "Ethan Morales", team: "sales" },
  { owner: "Jordan Tate", team: "sales" },
  { owner: "Lena Ortiz", team: "sales" },
  { owner: "Sasha Levin", team: "customerSuccess" },
  { owner: "Noah Bennett", team: "customerSuccess" },
  { owner: "Olivia Grant", team: "customerSuccess" }
];

const companies = [
  "Spotify",
  "Delta Air Lines",
  "Target",
  "Costco",
  "Starbucks",
  "Airbnb",
  "Netflix",
  "American Express",
  "Ford Motor Company",
  "Verizon",
  "Visa",
  "United Airlines",
  "Nike",
  "Coca-Cola",
  "JPMorgan Chase",
  "Adobe",
  "Salesforce",
  "UPS",
  "Lyft"
];

const meetingTypes = [
  "Discovery Call",
  "Platform Demo",
  "Pricing Review",
  "Implementation Touchpoint",
  "Quarterly Business Review",
  "Strategy Session",
  "Integration Workshop",
  "Onboarding Check-in",
  "Weekly Status Sync",
  "Executive Alignment",
  "Renewal Discussion",
  "Pilot Kickoff",
  "Product Deep Dive",
  "Roadmap Review",
  "Support Escalation Review"
];

// Date range
const START_DATE = new Date("2025-11-20T00:00:00Z");
const END_DATE = new Date("2026-02-28T23:59:59Z");

// Helpers
function isWeekend(date) {
  const d = date.getDay(); // 0 Sun, 6 Sat
  return d === 0 || d === 6;
}

function formatDate(date) {
  // e.g. "November 18, 2025"
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(date) {
  // e.g. "9:30 AM" - ensure format matches regex: (\d{1,2}:\d{2} [AP]M)
  // Use manual formatting to avoid non-breaking space from toLocaleTimeString
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert to 12-hour format
  const displayMinutes = minutes.toString().padStart(2, '0');
  // Use regular space (not non-breaking space) to match regex pattern
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createMeetingString(ownerName, date, startTime, endTime) {
  const company = randomItem(companies);
  const mtype = randomItem(meetingTypes);
  const firstName = ownerName.split(" ")[0];

  const title =
    Math.random() < 0.5
      ? `${company} <> ${firstName} | ${mtype}`
      : `${mtype} | ${company}`;

  return `${title}, ${formatDate(date)} ${formatTime(startTime)} - ${formatTime(
    endTime
  )}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * For each week:
 * - choose 4 weekdays (Mon–Fri)
 * - 1 has 3 meetings
 * - 2 have 2 meetings each
 * - 1 has 1 meeting
 * => 8 meetings per week minimum
 */
function generateMeetingsForOwner(ownerName) {
  const meetings = [];

  // Start from first Monday on/after START_DATE
  let jordan = new Date(START_DATE.getTime());
  while (jordan < END_DATE && jordan.getDay() !== 1) {
    jordan.setDate(jordan.getDate() + 1);
  }

  while (jordan <= END_DATE) {
    // Collect weekdays (Mon–Fri) for this week
    const weekDays = [];
    const weekStart = new Date(jordan.getTime());
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime());
      day.setDate(day.getDate() + i);
      if (day > END_DATE) break;
      if (!isWeekend(day)) weekDays.push(day);
    }

    if (weekDays.length === 0) break;

    // We want at least 4 weekdays in play; if fewer, use all but still follow pattern loosely
    const dayIndices = [...weekDays.keys()];
    // Shuffle
    for (let i = dayIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dayIndices[i], dayIndices[j]] = [dayIndices[j], dayIndices[i]];
    }

    const selected = dayIndices.slice(0, Math.min(4, weekDays.length));

    // Sort so days are in chronological order
    selected.sort((a, b) => a - b);

    // Assign meeting counts:
    // First = 3 meetings, next two = 2 meetings each, last = 1 meeting
    const pattern = [3, 2, 2, 1].slice(0, selected.length);

    for (let idx = 0; idx < selected.length; idx++) {
      const day = weekDays[selected[idx]];
      const count = pattern[idx];

      // Generate count meetings on this date with random time blocks
      // Start between 9:00 AM and 3:30 PM to allow 30–60 min meetings
      const usedSlots = [];
      for (let m = 0; m < count; m++) {
        let startHour, startMinute;

        // avoid overlapping exact same start times
        let tries = 0;
        do {
          tries++;
          const slotIndex = Math.floor(Math.random() * 9); // 0..8 => 9–16
          startHour = 9 + slotIndex;
          startMinute = Math.random() < 0.5 ? 0 : 30;
        } while (
          usedSlots.some(
            (s) => s.hour === startHour && s.minute === startMinute
          ) &&
          tries < 20
        );

        usedSlots.push({ hour: startHour, minute: startMinute });

        const startTime = new Date(day.getTime());
        startTime.setHours(startHour, startMinute, 0, 0);

        const duration = Math.random() < 0.7 ? 30 : 60; // more 30-mins than 60
        const endTime = addMinutes(startTime, duration);

        meetings.push(createMeetingString(ownerName, day, startTime, endTime));
      }
    }

    // Move jordan 7 days forward (next week)
    jordan.setDate(jordan.getDate() + 7);
  }

  // Sort meetings chronologically (nice for UI)
  meetings.sort((a, b) => {
    const dateA = new Date(a.split(", ").slice(-2).join(" "));
    const dateB = new Date(b.split(", ").slice(-2).join(" "));
    return dateA - dateB;
  });

  return meetings;
}

function generateDataset() {
  const payload = owners.map(({ owner, team }) => ({
    owner,
    team,
    meetings: generateMeetingsForOwner(owner)
  }));

  return payload;
}

// Run & write JSON to file
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = generateDataset();
const outputPath = join(__dirname, '..', 'public', 'dashboard-payload.json');

// Generate JSON string
const jsonContent = JSON.stringify(data, null, 2);

// Write to file
try {
  writeFileSync(outputPath, jsonContent, 'utf-8');
  
  // Verify the write was successful
  if (existsSync(outputPath)) {
    const writtenContent = readFileSync(outputPath, 'utf-8');
    if (writtenContent.length > 0) {
      console.log(`✅ Generated dashboard payload: ${outputPath}`);
      console.log(`   Total members: ${data.length}`);
      console.log(`   Total meetings: ${data.reduce((sum, member) => sum + member.meetings.length, 0)}`);
      console.log(`   File size: ${(writtenContent.length / 1024).toFixed(2)} KB`);
    } else {
      console.error('❌ Error: File was written but is empty!');
      process.exit(1);
    }
  } else {
    console.error('❌ Error: File was not created!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error writing file:', error.message);
  process.exit(1);
}

