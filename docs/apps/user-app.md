# `mobimatch` — User Android App

## Purpose

Lightweight Android app for technicians and shop owners to search mobile spare-part compatibility.

## Required screens

1. Splash/loading.
2. Google sign-in.
3. Mandatory profile completion.
4. Terms & Conditions / Privacy Policy acceptance.
5. Home/search.
6. Search suggestions/results.
7. Brand list (A–Z).
8. Models by brand (A–Z).
9. Category list (A–Z).
10. Compatibility results.
11. No compatibility found / report issue.
12. Submit issue report.
13. Submit missing-model request.
14. Profile/edit profile.
15. Account deletion confirmation/status.
16. Connection required / retry.
17. Maintenance/update-required screens.

## Home

- Large search box.
- Browse Brands.
- Browse Categories.
- Minimal profile/settings entry.
- No dashboard widgets, favorites or search-history page.

## Search UX

- Debounce requests (suggested 250–350 ms).
- Avoid sending empty or extremely short queries.
- Show loading, no suggestions and error states.
- Display brand + model name; optional model number where useful.
- Partial and typo-tolerant search comes from API; do not build a large local model database.

## Compatibility flow

Support model-first and category-first. Results display selected category, searched model, all active models in the compatibility group and total count. Show brand for each model. Copy List copies category and model list to clipboard. Do not add native share button.

## Reports

No-result screen includes Report Issue. Issue form has the four specified categories and optional description. Missing model request includes brand, model, optional model number and notes.

A report button on successful result screen is OPEN and should not be added unless owner confirms.

## Account and privacy

- User can edit phone, shop name and city.
- Name/email are Google-managed.
- Provide logout and logout-all-devices.
- Provide account deletion in-app and link to public deletion webpage.
- Provide Terms and Privacy links in Settings.

## Network behaviour

All features require internet. No compatibility database or offline cache. Show distinct maintenance and connection failure states. Retry on restored connectivity.

## Visual requirements

Light theme, clean typography, accessible touch targets, responsive phone layouts, English strings in localization-ready resources. No brand logos required.

## App update handling

Google Play manages normal updates. Backend app-config can signal a minimum supported version; if current app version is below minimum, show an update-required screen linking to the Play listing. Do not attempt to self-update APKs.
