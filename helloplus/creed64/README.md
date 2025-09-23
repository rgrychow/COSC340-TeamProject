# Copilot

I was unable to get the github copilot because I got denied three seperate times. I used chat gpt to make a simple program and provided a picture.

# HelloFitnessSimple — Push-Up Counter (Expo)

A simple Expo React Native app that lets you track push-ups with one tap. Built for Part 2 of the assignment.

What it does

Shows a “Push-Up Counter” title

Displays your current push-up count

+ Add Push-Up button to increment by 1

Reset (tap) and Undo 1 (long-press) behavior

Rotating motivational phrase (“One more rep than yesterday.”, etc.)

How to run (Windows → iPhone with Expo Go)


Install Node.js (LTS)

https://nodejs.org

Verify:

node -v
npm -v
npx -v


(PowerShell only) Allow npm/npx to run if blocked

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass


Install dependencies

npm install


Start the Expo dev server

npx expo start --tunnel


If Windows Firewall prompts for Node.js access, click Allow.

Open on your iPhone

Install Expo Go from the App Store

In Expo Go, tap Scan QR Code and scan the QR from your terminal (or the browser Dev Tools page)

You should now see the Push-Up Counter app. Every tap on the button adds a rep.

How this will be used

Good practice building and running a mobile app environment, testing changes live on your phone, and forming the base for future fitness features (sets, timers, history, etc.).
