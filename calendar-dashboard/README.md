# Team Calendar Dashboard

A modern, responsive calendar dashboard for viewing team schedules and meetings.

## Features

- 📅 Weekly calendar view with team member schedules
- 📋 List view for detailed meeting information
- 🎨 Modern, compact UI design
- 📱 Fully optimized for mobile devices
- 🔍 Filter by team and team member
- 🎯 Intuitive navigation and week selection

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Generate Dashboard Payload

To generate or regenerate the dashboard payload data:

```bash
npm run generate:payload
```

This writes `public/data-payload.update.json` with randomly generated meetings for all team members, covering **today through the end of the next June**.

While the app is open, when the chronologically last meeting has occurred it automatically generates and appends another **6 months** of meetings (and keeps doing so). Extended data is stored in `localStorage` so it survives refreshes.

**Note:** This is a temporary solution until the project is connected to a real API. Once connected, the API will provide the meeting data directly.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```
