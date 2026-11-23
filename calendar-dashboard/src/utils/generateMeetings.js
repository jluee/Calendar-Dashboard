/**
 * Synthetic meeting dataset generator.
 * Used by the CLI script and by the app to roll forward dummy data.
 */

export const owners = [
  { owner: "Ethan Morales", team: "sales" },
  { owner: "Jordan Tate", team: "sales" },
  { owner: "Lena Ortiz", team: "sales" },
  { owner: "Sasha Levin", team: "customerSuccess" },
  { owner: "Noah Bennett", team: "customerSuccess" },
  { owner: "Olivia Grant", team: "customerSuccess" }
];

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

function isWeekend(date) {
  const d = date.getDay();
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
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
}

function formatLabelDate(date, startTime, endTime) {
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
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let body = "";
  for (let i = 0; i < 15; i++) {
    body += alphabet[randomInt(0, alphabet.length - 1)];
  }
  return `${prefix}${body}`;
}

function createContacts(externalEmails, company, ownerId) {
  return externalEmails.map((email) => {
    const [local] = email.split("@");
    const nameParts = local
      .split(".")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    const name = nameParts.join(" ");

    return {
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
  });
}

function createOpportunities(company, ownerId) {
  const opportunities = [];
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

    opportunities.push({
      OwnerId: ownerId,
      Name: `${company.name} - ${stage} Motion`,
      AccountId: generateSalesforceId("001"),
      Amount: randomInt(30000, 250000),
      StageName: stage,
      Probability: probabilityMap[stage] ?? 10
    });
  }
  return opportunities;
}

/**
 * Generate meetings for one owner between startDate and endDate (inclusive).
 */
export function generateMeetingsForOwner(ownerName, team, startDate, endDate) {
  const meetings = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start.getTime());
  while (currentDate < end && currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const meetingTypes =
    team === "sales" ? meetingTypesSales : meetingTypesCS;

  while (currentDate <= end) {
    const weekDays = [];
    const weekStart = new Date(currentDate.getTime());
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime());
      day.setDate(day.getDate() + i);
      if (day > end) break;
      if (day < start) continue;
      if (!isWeekend(day)) weekDays.push(day);
    }

    if (weekDays.length === 0) {
      currentDate.setDate(currentDate.getDate() + 7);
      continue;
    }

    // Cap by weekday capacity (max 3 meetings/day) so short weeks never hang
    const maxCapacity = weekDays.length * 3;
    const totalMeetings = Math.min(randomInt(5, 10), maxCapacity);
    const dayMeetings = new Array(weekDays.length).fill(0);
    let remaining = totalMeetings;

    const daysWithMeetings = Math.min(
      weekDays.length,
      Math.max(1, Math.min(5, totalMeetings))
    );
    const selectedDays = [...weekDays.keys()];
    for (let i = selectedDays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedDays[i], selectedDays[j]] = [selectedDays[j], selectedDays[i]];
    }

    const daysToUse = selectedDays.slice(0, daysWithMeetings);
    for (let i = 0; i < daysWithMeetings && remaining > 0; i++) {
      dayMeetings[daysToUse[i]] = 1;
      remaining--;
    }

    let safety = maxCapacity * 4;
    while (remaining > 0 && safety-- > 0) {
      const dayIdx = randomInt(0, weekDays.length - 1);
      if (dayMeetings[dayIdx] < 3) {
        dayMeetings[dayIdx]++;
        remaining--;
      }
    }

    const selected = [];
    for (let i = 0; i < dayMeetings.length; i++) {
      if (dayMeetings[i] > 0) selected.push(i);
    }
    selected.sort((a, b) => a - b);

    for (let idx = 0; idx < selected.length; idx++) {
      const day = weekDays[selected[idx]];
      const count = dayMeetings[selected[idx]];
      const usedSlots = [];

      for (let m = 0; m < count; m++) {
        let startHour;
        let startMinute;
        let tries = 0;

        do {
          tries++;
          const slotIndex = randomInt(0, 8);
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

        const company = randomItem(companies);
        const meetingType = randomItem(meetingTypes);
        const firstName = ownerName.split(" ")[0];

        const externalEmails = generateEmails(company, randomInt(1, 4));
        const Email_Domain__c = `.${company.domain.toUpperCase()}`;
        const contacts = createContacts(
          externalEmails.slice(0, randomInt(1, externalEmails.length)),
          company,
          "005" + generateSalesforceId("").slice(3)
        );
        const opportunities = createOpportunities(company, contacts[0].OwnerId);

        const labelDatePart = formatLabelDate(day, startTime, endTime);
        const labelPrefix =
          Math.random() < 0.5
            ? `${company.name} <> ${firstName} | ${meetingType}`
            : `${meetingType} | ${company.name}`;

        meetings.push({
          label: `${labelPrefix}, ${labelDatePart}`,
          externalEmails,
          Email_Domain__c,
          start: toIsoWithOffset(startTime),
          end: toIsoWithOffset(endTime),
          contacts,
          opportunities
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 7);
  }

  meetings.sort((a, b) => new Date(a.start) - new Date(b.start));
  return meetings;
}

/**
 * Full dataset for every owner between startDate and endDate.
 */
export function generateDataset(startDate, endDate) {
  return owners.map(({ owner, team }) => ({
    owner,
    team,
    meetings: generateMeetingsForOwner(owner, team, startDate, endDate)
  }));
}

/**
 * Latest meeting end time across the entire dataset, or null if empty.
 */
export function getLastMeetingEnd(dataset) {
  let latest = null;
  for (const member of dataset) {
    for (const meeting of member.meetings || []) {
      const end = new Date(meeting.end || meeting.start);
      if (!latest || end > latest) latest = end;
    }
  }
  return latest;
}

/**
 * Start of "today" in local time.
 */
export function startOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * End of June following `from` — if already past June this year, next year's June.
 * Used for the initial seed window ("now until June").
 */
export function endOfNextJune(from = new Date()) {
  const year =
    from.getMonth() > 5 ? from.getFullYear() + 1 : from.getFullYear();
  return new Date(year, 5, 30, 23, 59, 59, 999);
}

/**
 * Add months to a date (keeps time-of-day).
 */
export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Day after a given date at 00:00:00.
 */
export function dayAfter(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Merge newly generated meetings into an existing dataset by owner.
 */
export function appendMeetings(existingDataset, newDataset) {
  const byOwner = new Map(
    existingDataset.map((member) => [member.owner, { ...member, meetings: [...(member.meetings || [])] }])
  );

  for (const member of newDataset) {
    const current = byOwner.get(member.owner);
    if (current) {
      current.meetings = [...current.meetings, ...member.meetings].sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );
    } else {
      byOwner.set(member.owner, {
        owner: member.owner,
        team: member.team,
        meetings: [...member.meetings]
      });
    }
  }

  return Array.from(byOwner.values());
}

/**
 * If the chronologically last meeting has already occurred, generate the next
 * `months` of meetings and append them. Repeats until the calendar extends
 * past now (covers catching up after long gaps).
 *
 * Returns { data, extended } where extended is true if new meetings were added.
 */
export function extendDatasetIfNeeded(dataset, options = {}) {
  const {
    now = new Date(),
    months = 6,
    maxExtensions = 4
  } = options;

  let data = dataset.map((member) => ({
    ...member,
    meetings: [...(member.meetings || [])]
  }));
  let extended = false;

  for (let i = 0; i < maxExtensions; i++) {
    const lastEnd = getLastMeetingEnd(data);
    if (!lastEnd) {
      const start = startOfToday(now);
      const end = endOfNextJune(now);
      data = generateDataset(start, end);
      extended = true;
      continue;
    }

    if (now < lastEnd) break;

    const rangeStart = dayAfter(lastEnd);
    const rangeEnd = addMonths(rangeStart, months);
    rangeEnd.setHours(23, 59, 59, 999);

    const batch = generateDataset(rangeStart, rangeEnd);
    data = appendMeetings(data, batch);
    extended = true;
  }

  return { data, extended };
}
