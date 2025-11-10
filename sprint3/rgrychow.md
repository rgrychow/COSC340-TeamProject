Sprint 3  
Name: Ryan M. Grychowski  
GitHub ID: rgrychow  
Group Name: AimHigh  

### What you planned to do
- Integrate Firebase to store user data and workout progress in Firestore.  
- Connect the Progress Tab to sync data to and from the cloud.  
- Add cloud sync indicators and error handling.  
- Rebuild Profile Tab to pull and edit user data directly from Firebase.  

### What you did not do
- Did not finish automatic real-time sync (manual push/pull only).   
- Did not yet implement user-based analytics or aggregated stats from Firestore.  
- Did not set up proper Firebase rules for smooth operations.

### What problems you encountered
- Firebase permission issues and inconsistencies when syncing workouts.  
- A bad Firestore data structure at first
- Merge conflicts between teammates working in `progress.tsx` and `profile.tsx`.  
- Expo navigation problems between Home and Profile icons for the profile settings. 
- TypeScript errors 

### Issues you worked on
- #39 Optimize Progress.tsx
- #38 Add Profile Customization
- #37 Add Backend Integration   

### Files you worked on
- app/(tabs)/progress.tsx  
- app/(tabs)/profile.tsx  
- firebaseHelper.ts  
- firebase.js  
- hooks/useWorkouts.ts  
- utils/calc.ts  
- utils/date.ts  
- utils/streak.ts  

### Use of AI and/or 3rd party software
- Used ChatGPT to help refactor the Progress Tab with Firestore sync logic.  
- Used ChatGPT to cleanup and debug problems with `firebaseHelper.ts`.  
- Used Grok and Expo documentation to debug Firebase setup in Expo Go.  
- AI helped structure Firestore paths and error problems.

### What you accomplished
- Implemented full Firebase integration with Firestore and Auth.  
- Added automatic “Sync → Cloud” and “Pull ← Cloud” buttons to upload and fetch workout data.  
- Added a live sync indicator showing local/synced/downloaded status.  
- Rebuilt the Profile Tab to fetch and update user data in real time.  
- Polish up the visual consistency across all major tabs (Home, Fitness, Progress, Profile).  
