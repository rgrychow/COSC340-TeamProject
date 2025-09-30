# Sprint 1
**Name:** Ryan Grychowski
**GitHub ID:** rgrychow
**Group Name:** AimHigh

## What you planned to do
- Create an app environment for our AimHigh Project to run on. (Issue #1)
- Create tabs and fill with dummy data to get a foundation set (Issue #2)
- Include a log in page where you can create an account. (Issue #8)

## What you did not do
- Did not fully integrate helper functions into team members code. (Move to Sprint 2)

## What problems you encountered
- Initially had trouble assignment everybody an equal amount of work.
- Trouble with Git pushes / pulls due to divergent branches and needing to install extra software.
- Getting on a good routine / timeline with the team.

## Issues you worked on
- [#1 Create AimHigh Project](https://github.com/rgrychow/COSC340-TeamProject/issues/1)
- [#2 Create Tabs and Implement Theme](https://github.com/rgrychow/COSC340-TeamProject/issues/2)
- [#6 User Input](https://github.com/rgrychow/COSC340-TeamProject/issues/6)

# Files you worked on
- `AimHigh/AimHigh/hooks/useNow.ts`
- `AimHigh/AimHigh/hooks/useProgress.ts`
- `AimHigh/AimHigh/hooks/useWorkouts.ts`
- `AimHigh/AimHigh/hooks/useNutrition.ts`
- `AimHigh/AimHigh/utils/date.ts`
- `AimHigh/AimHigh/utils/calc.ts`

# Use of AI and/or 3rd party software
I used AI (ChatGPT) for: 
- Debugging Git push / pull conflicts
- Writing initial templates for hooks and utilities

Also used Node / React built-in packages as 3rd party tools.

# What you accomplished

I was out of town for the first week of the sprint so I got off the ground a little late. To make up my
portion of the work, we decided that I would help make things more efficient by providing code that helped
clean up the other group members code. I accomplished this by making the following functions:
`useWorkouts.ts`
- Manages workout data with reps and weight.
`useProgress.ts`
- Calculates progress stats from workouts + meals
`useNutrition.ts`
- Keeps track of nutrition targers (calories, protein, carbs, fat) and meals
`useNow.ts`
- Keep current time updated
`calc.ts`
- Provides simple math helpers
`date.ts`
- Provides reusable date / time formatting

Documentation for return values from these functions are found in HOOKSnUTILS.md file in the project
folder. 

I also learned to manage Git commits properly, including resolving conflicts and ensuring folders appear 
on Github!






