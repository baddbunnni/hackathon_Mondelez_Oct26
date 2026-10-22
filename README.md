# fieldwork · Career Discovery Quiz

A hackathon concept prototype (hackathon hosted by Mondelēz International and the Food and Drink Federation), styled to match the Fieldwork website. It helps young people discover careers in food engineering and manufacturing, recognise the skills they already have, and take a realistic next step. It is **employer-neutral** and is not a recruitment tool.

It is a static site with no build step, backend, API keys or data storage. The primary persona is **Jordan Taylor**: 20, Midlands, GCSEs, unfinished college, no paid work history, and unsure where to start.

## View it

Double-click `index.html`, or run:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. The tests are at http://localhost:8765/tests/run.html.

## Journey

1. **Four questions:** interests, current situation (+ optional 14–19 check at school or college), hands-on experience (yes / not yet), and goal (options depend on situation).
2. **A career that could suit you:** one main match plus up to 2 alternatives ("Make this my top pick"), illustrative problems, and a "day in the life" placeholder.
3. **Your Next Move:** one recommended action plus up to 2 alternatives, tailored to situation and goal. Each one has a reason, labelled links with "After you click" instructions, and a checklist. The skills action includes a skill spotter for people with no paid work history.

## Where links go (verified 2026-10-22)

| Label | Source |
|---|---|
| Job search | GOV.UK Work Hub (`jobs.service.gov.uk/jobs/search?keywords=`) and GOV.UK Find an apprenticeship (`?searchTerm=`). Search words come from the chosen career and the user's stage. |
| Careers information | National Careers Service job profiles, Find a course, Discover your skills; GOV.UK Become an apprentice |
| Employer careers page | Mondelēz International career areas |
| Published programme info | Mondelēz International UK early careers and RWEX pages. This is never presented as a vacancy. |
| Confirmed live vacancy | Never shown: fieldwork doesn't check listings |

## Files

| File | Purpose |
|---|---|
| `js/data.js` | Content, link sources, career areas with verified search terms and NCS profiles, skill spotter, programme facts |
| `js/rules.js` | Rules engine: profile → career scores → recommended action and alternatives → `nextMove(career, action)` |
| `js/app.js` | UI: landing page, questions, results, Your Next Move |
| `css/styles.css` | Fieldwork theme: CSS custom properties for the palette, Barlow Condensed + Inter, responsive layout |
| `tests/run.html` + `tests/journeys.js` | Persona journeys, link and claim safety checks, a sweep of every answer combination |
| `tests/check-content.sh` | Scans for unverified employer names and unverified hosts |

## Deploy (Vercel)

It's a static site: import the folder as a project with framework preset **Other**, no build command, and output directory `.` (the root). `.vercelignore` keeps local tool settings out of the deploy. Fonts load from Google Fonts. `tests/` deploys too, at `/tests/run.html`. Delete it before deploying if you don't want that page public.
