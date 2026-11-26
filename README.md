# Hearth Ledger — Household Budget Site

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/keyi898/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/keyi898/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun)

An original household budget site that runs entirely in the browser from its own files. No account, no build step, no network requests: open `app/index.html` through any static server and everything works offline. All data lives in `localStorage` on the device.

## What it does

- **Overview dashboard** — this month's income, spending, savings and what's left; a hand-drawn SVG donut of spending by category; income vs spending vs savings bars for the last six months; tightest budgets, next bills due, and savings-goal progress at a glance.
- **Transactions** — add, edit and delete income and expenses; filter by category, search by description, switch months; export everything to CSV and import a CSV back in.
- **Budgets** — a monthly limit per category (housing, groceries, utilities, transport, health, dining, entertainment, shopping, kids, other) with progress bars that turn amber at 85% and red when over. Limits are editable inline.
- **Bills & subscriptions** — recurring payments with next-due dates worked out from the day of the month; "Mark paid" records the payment as a transaction and updates the last-paid date.
- **Savings goals** — target, saved so far, deadline, and the monthly amount needed to get there; contribute money to a goal in one tap.
- **50/30/20 analyzer** — splits the month into needs / wants / savings, compares it with adjustable targets (sliders always sum to 100%), and says in plain English what to trim or move.

The site ships with realistic demo data for a fictional two-adult household (six months of transactions, seven bills, four goals) so every page is alive on first load. "Reset demo data" in the top bar restores it.

## Run it

```bash
node serve.ts            # serves app/ at http://localhost:8080
```

Then open the address in a desktop browser or on a phone. Hash routes: `#/` overview, `#/transactions`, `#/budgets`, `#/bills`, `#/goals`, `#/analyze`.

## Hand in (make.fun)

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json` with the vendored library in `vendor/makefun-frontend.ts`.

## Layout

- `app/index.html` — page shell and navigation
- `app/style.css` — all styling (system font stack, responsive down to phone width)
- `app/js/data.js` — categories and the demo seed data
- `app/js/store.js` — localStorage state and the shared money maths
- `app/js/charts.js` — hand-drawn SVG donut and bar charts, progress bars
- `app/js/views.js` — one renderer per view
- `app/js/main.js` — hash router, forms, CSV import/export
- `main.ts` — hand-in program; `serve.ts` — local preview server; `shots.json` — which views the screenshots show

Vanilla HTML/CSS/JS only — no frameworks, no external fonts or images. License: MIT (see `LICENSE`).
