**Sprint 1**

Hogan O'Hara -- hohara29 -- AimHigh

**What you planned to do**

  Stand up a minimal CLI to fetch calories/macros for a given food using USDA FoodData
  Central (search + detail).
  Add .env-based configuration and keep secrets out of Git; gives access to APIs.
  Prepare repo for collaboration: .gitignore, package.json, install steps, and a README
  with run instructions.
  Support additional sources (Open Food Facts barcode; Nutritionix NLP). 

**What you did not do**

  Did not finish optional Nutritionix NLP route or key management.
  Did not create an HTTP API (Express) for the app to call—currently CLI only.

**What problems you encountered**

  Environment loading: initial “Missing USDA_API_KEY” due to .env not being detected;
  resolved by forcing dotenv to load from the script’s directory.
  Module format mismatch: Node treated the file as ESM ("type": "module"), causing require
  errors. Resolved by renaming to macro.cjs (CommonJS) or providing an ESM variant.

**Issues you worked on**

  #4 Access API
  
  #5 Food Data Storage
  
  #6 User Input

**Files you worked on**

  NutritionAPITemp/
  
    .env.example
    
    README.md
    
    macro.cjs
    
    macro.js

**Use of AI and/or 3rd party software**

  I used ChatGPT for quick scaffolding ideas and troubleshooting (ESM vs CommonJS, .env loading
  with dotenv, and wording for the README/documentation). I reviewed/edited all snippets before committing and
  verified behavior locally. Final design and implementation decisions were mine.

**What you accomplished**

  **Working CLI for macro lookup (USDA):**    
    Implemented a Node.js script (macro.cjs) that:
      Accepts a food query (e.g., node macro.cjs "chicken breast").
      Calls USDA search and detail endpoints, maps nutrient numbers (Calories 208, Protein 203,
      Carbs 205, Fat 204), and prints a clean summary.
      Selects a serving with gramWeight when available, otherwise reports per-100g; includes a 
      --grams N flag to scale manually.

  **Robust env + secrets handling:**
    Added .env loading (with explicit path), .env.example for teammates.

  **Repo readiness:**
    Created/updated package.json and scripts (npm start, npm run usda, etc.), and wrote a concise
    README with setup and run instructions (clone → npm install → copy .env.example → fill keys → run).

  **Extensibility scaffolding:**
    Outlined support for Open Food Facts (barcode via --barcode <EAN/UPC>) and Nutritionix (NLP via
    --nlp "2 eggs and 1 cup rice"), with optional keys in .env.
    Added a simple JSON output mode (--json) to make it easy to integrate with the future
    mobile/frontend or a server route.
