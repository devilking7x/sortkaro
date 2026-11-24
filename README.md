# SortKaro — Which bin does it go in?

A free, static waste-sorting helper for Indian households. Type an item in
English or Hindi and SortKaro tells you the right bin, why, and what to do
with it — plus a 10-item quiz that measures whether you (and the tool) sort
correctly. No server, no tracking, no data leaves the page — plain HTML/CSS/JS,
zero dependencies, works offline once loaded.

**Live demo:** https://devilking7x.github.io/sortkaro/
**Built for:** Arbiter Hacks V1 (Devpost), Theme Track: Rethinking Waste — solo entry by Mohd Raja (devilking7x).

## What it does

1. **Ask about an item** — a 73-item hand-built list of common Indian household
   items (vegetable peels to CFL bulbs), each with a bin, a plain explanation,
   and a disposal tip. Search works in English and Roman Hindi (`akhbaar`,
   `kele ka chilka`, `purana mobile`).
2. **Rule-based classifier** — exact match, aliases, then keyword rules. When
   it does not know an item it says "not sure" instead of guessing.
3. **Bin guide** — browse each bin: green = wet/compostable, blue = dry/
   recyclable, red = hazardous, separate e-waste collection, yellow bag =
   sanitary. Rules follow the Solid Waste Management Rules 2016 and common
   ULB practice; cities differ and the app says so.
4. **10-item quiz** — random items, pick the bin, get a score immediately.
   Best score is saved on the device only (localStorage).

## Measured results (from the test suite, not estimates)

- **Held-out evaluation: 20/20 correct (100%).** Twenty item names that are
  *not* in the 73-item list (e.g. "used AA battery", "cracked CFL bulb",
  "plastic milk packet", "broken LED bulb") — the classifier gets every one
  right. Recompute live in DevTools: `SortKaro.evaluateHeldOut()`.
- **Tricky pairs kept apart:** CFL bulb = hazardous (mercury), LED bulb =
  e-waste (circuit board); paint tin = hazardous, tin can = dry; milk packet
  = dry, chips packet = check locally.

## Honest limits

- SortKaro is a **guide, not a government rulebook**. Bin colours and rules
  vary by city and housing society.
- The classifier is **rule-based, not AI**. It does not recognise photos,
  brands, or items outside its list.
- It does not file complaints, book pickups, or contact any collector.

## Tests

```sh
npm test        # node --test tests/core.test.js (10 tests)
npm run smoke   # Playwright smoke checks in Firefox (12 checks)
```
