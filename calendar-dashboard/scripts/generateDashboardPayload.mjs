/* eslint-env node */

/**
 * Synthetic "fluff" dataset generator matching the new nested format:
 * [
 *   {
 *     owner: string,
 *     team: "sales" | "customerSuccess",
 *     meetings: [
 *       {
 *         label: string,
 *         externalEmails: string[],
 *         Email_Domain__c: string,
 *         start: string, // ISO-8601
 *         end: string,   // ISO-8601
 *         contacts: [...],
 *         opportunities: [...]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */

const owners = [
  { owner: "Ethan Morales", team: "sales" },
  { owner: "Jordan Tate", team: "sales" },
  { owner: "Lena Ortiz", team: "sales" },
  { owner: "Sasha Levin", team: "customerSuccess" },
  { owner: "Noah Bennett", team: "customerSuccess" },
  { owner: "Olivia Grant", team: "customerSuccess" }
];

// Completely fictional companies/domains to avoid real customer data
const companies = [
  { name: "Acme Insurance Group", domain: "acmeinsure.com" },
  { name: "Northwind Retail Co", domain: "northwindretail.com" },
  { name: "Orbitline Travel", domain: "orbitlinetravel.com" },
  { name: "Beacon Health Partners", domain: "beaconhealthpartners.com" },
  { name: "Brightwave Telecom", domain: "brightwavetelecom.com" },
  { name: "Atlas Logistics", domain: "atlas-logistics.co" },
  { name: "Pioneer Financial Services", domain: "pioneerfinserve.com" },
  { name: "Bluefox Software", domain: "bluefoxsoft.io" },
  { name: "Summit Energy Systems", domain: "summitenergy.io" },
  { name: "Everlane Support Solutions", domain: "everlane-support.com" }
];

const meetingTypesSales = [
  "Discovery Call",
  "Platform Demo",
  "Pricing Review",
  "Initial POV Conversation",
  "Quarterly Business Review",
  "Strategy Session",
  "Pilot Kickoff",
  "Product Deep Dive",
  "Roadmap Review",
  "Executive Alignment"
];

const meetingTypesCS = [
  "Customer Success Touchpoint",
  "Onboarding Check-in",
  "Weekly Status Sync",
  "Health Check",
  "Renewal Planning",
  "Adoption Workshop",
  "Support Escalation Review",
  "Quarterly Health Review",
  "Roadmap Review",
  "Admin Training Session"
];

const opportunityStageNames = [
  "SAL",
  "SQL",
  "Initial Demo",
  "Solutioning",
  "Proposal"
];

// Date range
const START_DATE = new Date("2026-01-15T00:00:00-05:00"); // Eastern - January 15, 2026
const END_DATE = new Date("2026-04-30T23:59:59-05:00");   // Eastern - April 30, 2026

// Helpers
function isWeekend(date) {
  const d = date.getDay(); // 0 Sun, 6 Sat
  return d === 0 || d === 6;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function toIsoWithOffset(date) {
  // Keep it simple: treat server time as local with fixed -05:00 offset
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
}

function formatLabelDate(date, startTime, endTime) {
  // e.g. "January 15, 2026 10:30 - 11:00 AM"
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  const fmtTime = (d) => {
    let h = d.getHours();
    const m = pad2(d.getMinutes());
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const startStr = fmtTime(startTime);
  const endStr = fmtTime(endTime);

  // For label, we typically drop AM/PM on start time if same as end
  const startNoAmPm = startStr.replace(" AM", "").replace(" PM", "");
  return `${month} ${day}, ${year} ${startNoAmPm} - ${endStr}`;
}

function generateEmails(company, count) {
  const externalEmails = [];
  for (let i = 0; i < count; i++) {
    const first = randomItem([
      "alex", "jordan", "taylor", "morgan", "riley", "casey", "jamie",
      "chris", "sam", "devon", "parker", "jules", "andrea", "marco"
    ]);
    const last = randomItem([
      "lee", "martin", "roberts", "gonzalez", "nguyen", "kim",
      "cooper", "thomas", "walker", "carter", "rivera", "murphy"
    ]);
    externalEmails.push(`${first}.${last}@${company.domain}`);
  }
  return externalEmails;
}

function generateSalesforceId(prefix = "003") {
  // ridiculously fake but structurally okay
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let body = "";
  for (let i = 0; i < 15; i++) {
    body += alphabet[randomInt(0, alphabet.length - 1)];
  }
  return `${prefix}${body}`;
}

function createContacts(externalEmails, company, ownerId) {
  const contacts = [];

  externalEmails.forEach((email) => {
    const [local] = email.split("@");
    const nameParts = local
      .split(".")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    const name = nameParts.join(" ");

    const contact = {
      attributes: {
        type: "Contact",
        url: `/services/data/v59.0/sobjects/Contact/${generateSalesforceId()}`
      },
      Name: name,
      Name_of_Account__c: company.name,
      AccountId: generateSalesforceId("001"),
      Email: email,
      Email_Domain__c: `.${company.domain.toUpperCase()}`,
      OwnerId: ownerId
    };

    contacts.push(contact);
  });

  return contacts;
}

function createOpportunities(company, ownerId) {
  const opportunities = [];

  // 0–2 opportunities per meeting
  const count = randomInt(0, 2);
  for (let i = 0; i < count; i++) {
    const stage = randomItem(opportunityStageNames);
    const probabilityMap = {
      SAL: 0,
      SQL: 10,
      "Initial Demo": 20,
      Solutioning: 40,
      Proposal: 60
    };

    const opp = {
      OwnerId: ownerId,
      Name: `${company.name} - ${stage} Motion`,
      AccountId: generateSalesforceId("001"),
      Amount: randomInt(30000, 250000),
      StageName: stage,
      Probability: probabilityMap[stage] ?? 10
    };

    opportunities.push(opp);
  }

  return opportunities;
}

/**
 * For each week:
 * - Randomly choose 5-10 meetings per week (varies by team member)
 * - Distribute meetings across weekdays (Mon–Fri) realistically
 * - Some days have 0-1 meetings, some have 2-3 meetings
 */
function generateMeetingsForOwner(ownerName, team) {
  const meetings = [];

  // Start from first Monday on/after START_DATE
  let currentDate = new Date(START_DATE.getTime());
  while (currentDate < END_DATE && currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const meetingTypes =
    team === "sales" ? meetingTypesSales : meetingTypesCS;

  while (currentDate <= END_DATE) {
    // Collect weekdays (Mon–Fri) for this week
    const weekDays = [];
    const weekStart = new Date(currentDate.getTime());
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime());
      day.setDate(day.getDate() + i);
      if (day > END_DATE) break;
      if (!isWeekend(day)) weekDays.push(day);
    }

    if (weekDays.length === 0) break;

    // Random number of meetings for this week (5-10)
    const totalMeetings = randomInt(5, 10);
    
    // Distribute meetings across weekdays
    // Strategy: Some days get 0, some get 1, some get 2, some get 3
    // We'll randomly assign meetings to days
    const dayMeetings = new Array(weekDays.length).fill(0);
    let remaining = totalMeetings;
    
    // First pass: give at least 1 meeting to some days (but not all)
    const daysWithMeetings = randomInt(3, Math.min(5, weekDays.length)); // 3-5 days will have meetings
    const selectedDays = [...weekDays.keys()];
    // Shuffle to randomize which days get meetings
    for (let i = selectedDays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedDays[i], selectedDays[j]] = [selectedDays[j], selectedDays[i]];
    }
    
    const daysToUse = selectedDays.slice(0, daysWithMeetings);
    for (let i = 0; i < daysWithMeetings && remaining > 0; i++) {
      dayMeetings[daysToUse[i]] = 1;
      remaining--;
    }
    
    // Second pass: distribute remaining meetings (can add 1-2 more to random days)
    while (remaining > 0) {
      const dayIdx = randomInt(0, weekDays.length - 1);
      if (dayMeetings[dayIdx] < 3) { // Max 3 meetings per day
        dayMeetings[dayIdx]++;
        remaining--;
      }
    }
    
    // Sort days that have meetings
    const selected = [];
    for (let i = 0; i < dayMeetings.length; i++) {
      if (dayMeetings[i] > 0) {
        selected.push(i);
      }
    }
    selected.sort((a, b) => a - b);

    for (let idx = 0; idx < selected.length; idx++) {
      const day = weekDays[selected[idx]];
      const count = dayMeetings[selected[idx]];

      const usedSlots = [];

      for (let m = 0; m < count; m++) {
        let startHour, startMinute;
        let tries = 0;

        // avoid exact slot collisions
        do {
          tries++;
          const slotIndex = randomInt(0, 8); // 9..17 hours (9–17)
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

        const duration = Math.random() < 0.7 ? 30 : 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // pick company + meeting type
        const company = randomItem(companies);
        const meetingType = randomItem(meetingTypes);
        const firstName = ownerName.split(" ")[0];

        const externalEmails = generateEmails(company, randomInt(1, 4));
        const Email_Domain__c = `.${company.domain.toUpperCase()}`;
        const contacts = createContacts(
          externalEmails.slice(0, randomInt(1, externalEmails.length)),
          company,
          // fake-ish owner id
          "005" + generateSalesforceId("").slice(3)
        );
        const opportunities = createOpportunities(company, contacts[0].OwnerId);

        // label like: "Acme & Ethan | Discovery Call, January 15, 2026 10:30 - 11:00 AM"
        const labelDatePart = formatLabelDate(day, startTime, endTime);
        const labelPrefix =
          Math.random() < 0.5
            ? `${company.name} <> ${firstName} | ${meetingType}`
            : `${meetingType} | ${company.name}`;

        const label = `${labelPrefix}, ${labelDatePart}`;

        meetings.push({
          label,
          externalEmails,
          Email_Domain__c,
          start: toIsoWithOffset(startTime),
          end: toIsoWithOffset(endTime),
          contacts,
          opportunities
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 7); // next week
  }

  // Sort chronologically by start
  meetings.sort((a, b) => new Date(a.start) - new Date(b.start));

  return meetings;
}

function generateDataset() {
  return owners.map(({ owner, team }) => ({
    owner,
    team,
    meetings: generateMeetingsForOwner(owner, team)
  }));
}

// --- Write to file (similar to your previous script) ---
import { writeFileSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = generateDataset();
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

