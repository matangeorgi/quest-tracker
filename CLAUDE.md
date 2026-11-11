# Quest Tracker

Floating macOS todo panel. Electron + React + TypeScript + Tailwind v4 (built with electron-vite).

## Commands

- `npm run dev` — run with hot reload (data file is shared with the installed app)
- `npm run typecheck` / `npm test` — must pass before a build
- `npm run build:mac` — builds `dist/mac-arm64/Quest Tracker.app` and a `.dmg`

## Rule: rebuild and install after each settled change

When a change is settled (the user says it looks good, or asks to finish or ship it), do this without being asked:

1. Run `npm run typecheck` and `npm test`. Stop and report if either fails.
2. Quit running copies: `pkill -f "quest-tracker/node_modules"` and `pkill -f "/Applications/Quest Tracker.app"`.
3. Run `npm run build:mac`.
4. Replace the installed app: `ditto "dist/mac-arm64/Quest Tracker.app" "/Applications/Quest Tracker.app"`.
5. Launch it with `open "/Applications/Quest Tracker.app"` and confirm the panel appears.
6. Report in one or two lines that the installed app is updated.

Do not rebuild for half-finished or experimental changes, only after the user has accepted them.

## Notes

- Saved data lives in `~/Library/Application Support/quest-tracker/` (`tasks.json`, `window.json`). Never delete or overwrite it when testing.
- Window blur uses the undocumented macOS function `CGSSetWindowBackgroundBlurRadius` through `koffi` (`src/main/windowBlur.ts`). If it fails, only blur stops working.
- Changing the shape of `tasks.json`: bump `DATA_VERSION` (`src/shared/types.ts`) and add a step in `src/main/migrate.ts`. Older apps leave a newer file untouched (`src/main/versionGuard.ts`), and newer apps upgrade older files, so users keep their tasks.
- The app has no Dock icon. Show/Hide, Start at login and Quit are in the menu-bar item "⚔ Quests".
