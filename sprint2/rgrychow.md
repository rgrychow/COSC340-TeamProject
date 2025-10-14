# Sprint 2  
**Name:** Ryan M. Grychowski  
**GitHub ID:** rgrychow  
**Group Name:** AimHigh

---

## What you planned to do
- Implement the progress tab with dynamic tracking and tie it to fitness tab.
- Integrate custom hooks (`useWorkouts`, `useProgress`, `useNutrition`) for state management  
- Integrate utility functions for calculations and date formatting  
- Add progress tab visuals with graph and stats with fitness tab data  

---

## What you did not do
- Did not yet connect to a backend or data storage (coming in Sprint 3 with Firebase...)  
- Did not add user-based data. The current progress uses shared local state only.
- Did not add saved data that is tied to an account. 
- Did not make a look up for fitness exercises

---

## What problems you encountered
- Git/GitHub syncing issues with nested folders caused some files to appear as deleted or ignored. 
- Merge conflicts due to teammates working on separate tabs simultaneously.
- Needed to restructure how hooks were imported to avoid errors.  
- Minor Expo routing issue when integrating the new `_layout.tsx` file.  

---

## Issues you worked on
- [#16 Replace Static Dummy Stats with Dynamic Calculations](https://github.com/rgrychow/COSC340-TeamProject/issues/16)  
- [#17 Use hooks to track workouts, averages, and personal bests](https://github.com/rgrychow/COSC340-TeamProject/issues/17)  
- [#18 Display Progress Visually](https://github.com/rgrychow/COSC340-TeamProject/issues/18)  

---

## Files you worked on
- `app/(tabs)/progress.tsx`  
- `app/(tabs)/_layout.tsx`  
- `hooks/useWorkouts.ts`  
- `hooks/useProgress.ts`  
- `utils/calc.ts`  
- `utils/date.ts`  
- `utils/streak.ts`  

---

## Use of AI and/or 3rd party software
- Used ChatGPT for code structuring and refactoring hooks for more clarity.  
- AI assisted in writing strong graphing visuals and tying dynamic tabs together.  
- Used Grok for conceptual learning about Expo Go.  

---

## What you accomplished
- Fully implemented a dynamic Progress Tab that now displays:  
  - Total workouts, sets, averages, and personal bests.  
  - Weekly progress bar and streak calculation.   
  - In-screen tab toggle for overview and trends.  
  - Line graph for visualizing progress in the form of best weight over time.  
- Connected fitness tab and progress tab through shared hooks (`useWorkouts`) for real-time updates.  
- Added modular utilities (`calc.ts`, `date.ts`, `streak.ts`) for data and time based calculations.  
- Established groundwork for Firebase integration in Sprint 3 by keeping data and hook based.  

---

