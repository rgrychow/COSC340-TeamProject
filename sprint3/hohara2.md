Sprint 3 
Hogan O'Hara -- hohara29 -- AimHigh

What You planned to do:
  - Add barcode scanning to the Nutrition tab to quickly capture foods by UPC.
  - Keep all state local (no backend yet), but wire it into the existing daily totals and ring.
  - Reuse the search → select → per-serving macros flow for scanned items.
  - Show each scanned/added food as a “Daily Log” entry with timestamp.
  - Minor UI polish for scan UX (loading state, haptics, and errors).

What you did not do:
  - No persistent user storage (no Firebase/Firestore in this sprint).
  - No cross-device history or sync.
  - No nutrition target sync with profile (targets stayed local for the sprint).

What problems you encountered:
  - UPC sources vary: serving size/grams often missing → added robust parsing and safe defaults.
  - Race conditions from rapid scans → added a lock (“scan gate”) with short timeout.
  - Diverse nutrient schemas (kcal per 100g vs per serving) → created a single normalization path.
  - UI errors when elements weren’t wrapped in Text/Fragments (fixed JSX structure).
  - Ensured totals and the ring update immediately after each add.

Issues Worked On: 
  - #43 Barcode Scan MVP
  - #44 Nutrition normalization (100g vs serving size)
  - #45 Daily Log integration for scanned items

Files Worked On: 
  - app/'(tabs)'/nutrition.tsx
  - components/nutrition-ring.tsx

Use of AI and/or 3rd party software: 

  - Used ChatGPT for quick fixes to JSX structure, state update patterns, and scan throttling ideas.
  - Referenced Open Food Facts docs/examples to normalize fields quickly.

What You Accomplished:
  - Scan → Parse → Add flow for UPCs that updates totals and the ring immediately.
  - Unified macros pipeline so both search and scan feed the same “add entry” logic.
  - Daily Log items recorded locally with timestamps for the current day.
  - Resilient UX: loading states, haptics, and friendly errors for missing data.
