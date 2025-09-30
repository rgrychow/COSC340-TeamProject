**Sprint 1**   
Name: Om Patel   
Github ID: ompatel-2347  
Group: AimHigh (fitness tracker)

**Planned objectives:**

- Set global top menu bar   
  - Issue \#13 [https://github.com/rgrychow/COSC340-TeamProject/issues/13\#issue-3469093146](https://github.com/rgrychow/COSC340-TeamProject/issues/13#issue-3469093146)  
- Create aesthetic, revolving, quick-start section  
  - Issue \#14 [https://github.com/rgrychow/COSC340-TeamProject/issues/14\#issue-3469099949](https://github.com/rgrychow/COSC340-TeamProject/issues/14#issue-3469099949)  
- Create fitness preview section with personal, dynamic data   
  - Issue \#15 [https://github.com/rgrychow/COSC340-TeamProject/issues/15\#issue-3469104229](https://github.com/rgrychow/COSC340-TeamProject/issues/15#issue-3469104229)  
- Integrate custom styles, fonts, and colors

**Could not do:**

- Integrate custom styles, fonts, and colors

**Reasoning:**

- I attempted to set custom Google fonts to use throughout the app. The app compiled without issues but there is an issue with viewing Google Fonts on IOS mobile devices. The app worked fine on the web, however with this being a mobile focused app, I decided to leave out the google font and instead, we will set a built in react fonts.

**Issues:**   
\#13  [https://github.com/rgrychow/COSC340-TeamProject/issues/13\#issue-3469093146](https://github.com/rgrychow/COSC340-TeamProject/issues/13#issue-3469093146) Set global top menu bar 

\#14 [https://github.com/rgrychow/COSC340-TeamProject/issues/14\#issue-3469099949](https://github.com/rgrychow/COSC340-TeamProject/issues/14#issue-3469099949) Create aesthetic, revolving, quick-start section

\#15 [https://github.com/rgrychow/COSC340-TeamProject/issues/15\#issue-3469104229](https://github.com/rgrychow/COSC340-TeamProject/issues/15#issue-3469104229) Create fitness preview section with personal, dynamic data 

**Files:**

- Home.tsx   
  - AimHigh/AimHigh/app/(tabs)/home.tsx

**AI use:**  
I mainly used Co-Pilot for css styling in the React Native app. Remembering all the built-in css styles in React is hard to remember and time-consuming to implement. AI is a good fit for helping me here.

 The 3rd party tool used is Expo Go, which translates React code to mobile.

**Accomplishments:**

Created the global top menu bar. This ‘bar’ will appear on all pages on top and has useful links such as an app search function and profile link. It is not really a bar, but a few icons that are clickable. 

Created a quick start section on the home page. This quick start is an aesthetic, revolving carousel of high definition images that correlate to an activity you can get started on. These include (for now) Start Workout, Start Run, and Track Meals.

Created a fitness preview section. This dynamic section is tailored to each individual profile and has quick links such as how many workouts you have left and your macro goals (calories, protein, fats, carbs). These parameters are adjustable and will reflect on the app. 