# Copilot instructions for My Fitness Tracker (Expo + Router)

This file contains focused guidance for AI coding agents working in this repository so they can be productive immediately.

- Project type: Expo React Native app created with `create-expo-app` and using `expo-router` file-based routing.
- Start dev server: `npm install` then `npx expo start` (see `package.json` scripts).

What to know about the structure
- `app/` — file-based routes. Root layout: `app/_layout.tsx` (uses `expo-router` Stack and `ThemeProvider`).
- `app/(tabs)/index.tsx` — primary home screen for the tab group.
- `components/` — reusable UI primitives (e.g. `themed-text.tsx`, `themed-view.tsx`, `external-link.tsx`, `haptic-tab.tsx`). Use these instead of raw `View`/`Text` when theme-aware behavior is needed.
- `hooks/` — app hooks for color scheme and theme colors (`use-color-scheme.ts`, `use-theme-color.ts`). Prefer them to determine colors.
- `constants/theme.ts` — central color and font definitions. When setting colors, call `useThemeColor` to respect light/dark modes.
- `scripts/reset-project.js` — helper to reset starter content; `npm run reset-project` runs it.

Coding patterns and conventions
- Theme first: UI components use `useThemeColor` and `use-color-scheme`. New components should accept `lightColor`/`darkColor` props and call these hooks when rendering colors.
- File-based routing: Add screens under `app/` (e.g. `app/profile.tsx` or `app/(tabs)/progress.tsx`). To add modal routes, follow `app/_layout.tsx` which registers `Stack.Screen name="modal"`.
- Path aliasing: imports use `@/` to reference project root (see `tsconfig.json` for path mapping). Use `@/components/...`, `@/hooks/...`, `@/constants/...`.
- Platform checks: code uses `process.env.EXPO_OS` and `Platform` (from `react-native`) to conditionally run platform-specific logic (see `components/haptic-tab.tsx` and `components/external-link.tsx`). Keep platform branching minimal and explicit.

Developer workflows and quick commands
- Install deps: `npm install`.
- Start dev server: `npx expo start` or `npm run start`.
- Run on Android device/emulator: `npm run android`. iOS simulator: `npm run ios`. Web: `npm run web`.
- Lint: `npm run lint` (uses Expo's ESLint config).
- Reset example app: `npm run reset-project` (interactive script; moves starter files to `app-example`).

Testing and assumptions
- There are no automated tests in this repository. Do not add heavy test infra without checking with maintainers.
- TypeScript is configured; preserve existing `tsconfig.json` conventions. Keep props typed (avoid `any`).

Examples (from repo)
- Theme usage: `components/themed-view.tsx` calls `useThemeColor({ light, dark }, 'background')` and returns a `View` with background applied.
- External links: `components/external-link.tsx` uses `expo-router`'s `Link` and `expo-web-browser` to open in-app on native. Follow this pattern for in-app external linking.

When editing files
- Make minimal, focused changes. Respect existing style and project imports (use `@/...`).
- If adding routes, ensure `app/_layout.tsx` remains consistent and register modals via Stack screens.
- If adding dependencies, update `package.json` and keep versions aligned with Expo SDK `~54` used here.

What not to change without asking
- `app/_layout.tsx` Stack structure and theme provider wiring.
- `tsconfig.json` path aliases.
- Expo SDK major version in `package.json` unless upgrading the whole project.

If unsure, ask maintainers which direction to take before changing global config or adding testing infra.

---
If any section is unclear or you want deeper examples (e.g., adding a new tab route, creating a themed component, or a PR template), say which area and I'll expand.
