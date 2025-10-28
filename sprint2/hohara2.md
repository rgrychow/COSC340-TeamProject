Sprint 2
Hogan O'Hara -- hohara29 -- AimHigh

What You planned to do:
  - Integrate the USDA FoodData API into the nutrition tab on the app.
  - Format the Nutrition search to search -> select food -> view macros
  - Add inputs to calculate macros per serving and servings consumed, then roll into a daily total.
  - Show a daily intake graphic
  - Make buttons within the page feel "interactive"
  - Add a simple recipe lookup using ingredients

What you did not do:
  - No persistent storage based on user information (no backend)
  - Did not implement barcode scanning feature for food products

What problems you encountered:
  - API key issues, moving from CLI to expo. Able to resolve using a .env to store API key (not super secure)
  - Formatting issues. Learning the new code style took a while but got it figured out.
  - UI interaction errors. Not able to scroll, had to wrap code in <ScrollView>
  - Button animations and SVG ring. Had to look up formatting for both.

Issues Worked On:
  #22 API Integration
  #23 Save Macro Information
  #24 Meal Search

Files Worked On:
  app/'(tabs)'/nutrition.tsx
  components/nutrition-ring.tsx
  app.config.js

Use of AI and/or 3rd party software:
  Used ChatGPT for formatting issues regrarding the new language, once the basics were learned
  it was fairly easy to adjust and apply to each aspect. Majority of help on small snippets like
  button animation and the SVG ring graphics, as well as assiting in finding and linking the proper
  APIs for functionality.

What You Accomplished:
  - USDA search inside the app, giving a list of best matches to select from
  - Per-serving Macros, giving the user the ability to specifiy the amount of food consumed and to store for the day
  - Daily Totals, showing a grphic ring for daily macro consumption as well as storing each food input by time
  - Interactive Buttons, give the page a more finihsed feeling
  - Recipe Lookup, used TheMealDB to give user recipe ideas based on ingredients listed
