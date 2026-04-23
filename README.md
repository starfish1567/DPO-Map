# DPO Live Map

An open-source vehicle map for DPO that works on GitHub Pages.

The app shows a map of published DPO vehicles, lets you click a vehicle marker or list item, and opens a friendly detail panel with route information, delay, vehicle details, accessibility flags, and a photo.

## What this repo includes

- A static frontend in plain HTML, CSS, and JavaScript
- A Python fetch script that pulls live vehicle data from the DPO dashboard API
- A GitHub Actions workflow that refreshes `data/vehicles.json`
- MIT licensing so the project is easy to fork and improve

## Why it is GitHub Pages-friendly

The DPO API response does not expose browser CORS headers, so a frontend hosted on GitHub Pages cannot safely call the API directly from the browser.

This repo solves that by:

1. Fetching the data server-side with Python
2. Saving it into `data/vehicles.json`
3. Letting the static frontend read that published JSON file

That means the site stays simple to host while still showing fresh data whenever the workflow updates the snapshot.

## Project structure

```text
.
├── .github/workflows/refresh-data.yml
├── app.js
├── data/vehicles.json
├── DPOAPI.py
├── index.html
├── scripts/fetch_dpo_data.py
├── styles.css
└── requirements.txt
```

## Local development

### 1. Install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Fetch a fresh data snapshot

```bash
python3 DPOAPI.py
```

Or:

```bash
python3 scripts/fetch_dpo_data.py --output data/vehicles.json
```

### 3. Start a local static server

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

### Option A: Deploy from the root of the default branch

1. Push this repository to GitHub.
2. Open `Settings` -> `Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Pick your default branch and the `/ (root)` folder.
5. Save.

GitHub Pages will publish `index.html` directly from the repo root.

### Option B: Customize the schedule

The workflow in `.github/workflows/refresh-data.yml` refreshes `data/vehicles.json` on a schedule and on manual trigger.

The app also checks for a newer published JSON snapshot in the browser every 15 seconds.

If you want a different refresh cadence, update the `cron` expression in that workflow. GitHub Actions scheduled workflows are not suitable for every-second updates, so the repo is set to 5 minutes there and 15-second polling in the browser.

## Data refresh workflow

The included workflow:

- installs Python dependencies
- runs the DPO fetch script
- commits the changed `data/vehicles.json`

If the DPO API changes later and starts requiring auth or cookies, you can update `scripts/fetch_dpo_data.py` to read them from GitHub Actions secrets instead of hardcoding them in the repo.

## Open-source notes

- License: MIT
- Contributions: welcome
- Good first ideas:
  - route-specific filters
  - auto-refresh in the browser
  - clustering markers when zoomed out
  - better mobile interaction patterns
  - tests around payload normalization

## Documentation

- [API notes](./docs/API.md)
- [Contributing guide](./CONTRIBUTING.md)

## Disclaimer

This is an unofficial community project. It is not affiliated with DPO unless you explicitly make it so.
