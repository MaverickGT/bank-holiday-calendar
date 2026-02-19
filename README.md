# 🌍 Bank Holiday Calendar

A beautiful, responsive full-year calendar that displays public bank holidays for every country in the world.

![Built with](https://img.shields.io/badge/Built%20with-HTML%20%7C%20CSS%20%7C%20JS-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Full-year view** — All 12 months displayed in a clean 3×4 grid
- **Global coverage** — Select any country to view its public holidays
- **Holiday tooltips** — Hover over highlighted days to see holiday details
- **Year navigation** — Browse holidays for any year
- **Responsive design** — Adapts from desktop to mobile
- **Lightweight** — Pure HTML, CSS, and vanilla JavaScript — no frameworks or dependencies
- **Docker-ready** — Ships with an nginx-based Dockerfile for easy deployment

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Structure | HTML5               |
| Styling   | Vanilla CSS         |
| Logic     | Vanilla JavaScript  |
| Font      | Inter (Google Fonts)|
| API       | [Nager.Date](https://date.nager.at) |
| Hosting   | Docker / nginx      |

## Getting Started

### Run locally

Serve the files with any static server. For example:

```bash
npx -y serve -l 5050
```

Then open [http://localhost:5050](http://localhost:5050) in your browser.

### Run with Docker

```bash
docker build -t bank-holiday-calendar .
docker run -p 8080:80 bank-holiday-calendar
```

Then open [http://localhost:8080](http://localhost:8080).

## Project Structure

```
bank_holiday_calendar/
├── index.html      # Main HTML page
├── style.css       # All styling and design tokens
├── app.js          # Application logic, API calls, rendering
├── Dockerfile      # Production Docker image (nginx:alpine)
└── README.md       # This file
```

## API

Holiday data is sourced from the free [Nager.Date API](https://date.nager.at). No API key is required.

## Developed by

**GT Consulting**
