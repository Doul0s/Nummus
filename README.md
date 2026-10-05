# Nummus

A local-only expense tracker. Multi-currency, recurring expenses, no account.

Built with Expo (SDK 57) and Expo Router. Data lives in SQLite on the device.

## Features

- Add, edit, and delete expenses with an amount, description, note, date, and currency
- Multi-currency throughout; totals are kept and shown **per currency**, never summed across them
- Recurring expenses on a monthly or yearly interval, with pause and resume
- History grouped by month, with per-month per-currency totals
- English and French, following the device locale by default
- Light and dark themes

## Privacy

There is no account, no server, and no analytics. `src/` contains no `fetch`,
`XMLHttpRequest`, or `WebSocket` — the app never opens a network connection.
Everything is stored in `nummus.db` on the device, and uninstalling removes it.

The consequence worth knowing: there is no backup. A broken database cannot be
recovered from anywhere else.

## Requirements

Node.js and npm. There is no `engines` pin in `package.json`; this was developed
against Node 26 and npm 12.

## Getting started

```bash
npm install
npm start
```

Then press `i` for the iOS simulator, `a` for Android, `w` for web, or scan the
QR code with Expo Go.

The project uses native modules (`expo-sqlite`, `@react-native-community/datetimepicker`),
so **Expo Go is not enough** — use a development build:

```bash
npx expo run:ios      # or run:android
```

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run ios` / `android` / `web` | Start and open that platform |
| `npm run lint` | ESLint via `expo lint` |
| `npx tsc --noEmit` | Typecheck |
| `npx expo-doctor` | Diagnose dependency and config problems |
| `npx expo install --check` | Verify installed versions match the SDK |

Run `lint` and `tsc --noEmit` before calling any task done.

There is no test suite. `npx tsc --noEmit` needs `.expo/types/router.d.ts`, which
is generated the first time the dev server starts, so run `npm start` once on a
fresh clone or the typecheck will report bogus errors on valid routes.

## Layout

```
src/
  app/              routes; every file is a screen
    _layout.tsx      root stack + SQLiteProvider
    (tabs)/          Home, History, Subscriptions
    add.tsx          add expense modal
    expense/[id].tsx edit / delete
    settings.tsx
  components/       UI primitives (ui.tsx), ExpenseForm, ExpenseRow, CurrencyPicker
  db/               expenses.ts, recurring.ts, migrate.ts
  lib/              date, money, recurring, i18n — pure logic, no React
  locales/          en.json, fr.json
  theme.ts          colors, spacing, type scale
```

`lib/` is deliberately free of React and DB imports. Recurring date math in
particular is pure, which makes it straightforward to reason about and to test.

## Notes on the implementation

**Money is stored as integer minor units.** `12.50 EUR` is `1250`. No floats
touch a balance, and the schema enforces `CHECK (amount_minor > 0)`.

**Amount input accepts what people actually type.** `parseAmountToMinorUnits`
handles `.5`, `12,50`, `1 234,56`, `1,234.56`, `1.234,56`, and `1'234.56`. The
disambiguation rule: the rightmost separator is the decimal mark *unless* exactly
three digits follow it, which makes it a thousands group. So `1,234` is 1234 and
`12,5` is 12.50. This is genuinely ambiguous input and the heuristic is a
judgement call — `0.001` in a 2-decimal currency is read as `0.01`.

**Migrations are keyed on `PRAGMA user_version`, and there is no version 2.**
Migration 2 was a `DROP TABLE` that recreated an identical schema. It was removed
because it would have destroyed user data, and because the numbers it consumed
can never be reused. **The next migration must be numbered 4.** Devices in the
field report `user_version = 3`; adding a `version: 2` would be silently skipped
by every existing install, not rejected.

**Recurring generation is idempotent.** A partial unique index on
`(recurring_id, spent_at) WHERE recurring_id IS NOT NULL` plus `INSERT OR IGNORE`
and a `last_generated` watermark means a due date can only ever materialise once,
even across crashes mid-transaction. Deleting a subscription clears `recurring_id`
on its past expenses instead of deleting them, so history survives.

**Boot is resilient in one direction only.** A failed migration propagates and
stops startup — an unusable schema should fail loudly rather than surface later
as every query throwing. A failed recurring generation is caught and logged,
because generation writes rows on every cold start and must never prevent the app
from opening. The home screen retries it on the next foreground.

**Locale handling is split deliberately.** Currency and date *formatting* follows
the app's selected language; the *default* currency and first day of week come
from the device locale.

## Release status

`ios.bundleIdentifier` and `android.package` are set to `com.nummus.app`. There is
no `eas.json` yet, so `eas build` is not configured. Add bundle IDs and a build
profile before shipping.

## Not done

- No tests. `parseAmountToMinorUnits` and the recurring date math in
  `lib/recurring.ts` are the two places where a regression would be silent.
- `history.tsx` loads every expense at once with no pagination.
- `generateDueExpenses` dedupes through a module-level `inFlight` promise, which
  is hard to test and can drop a date change that arrives mid-flight.
- `dueDates` walks from the first occurrence on every call, so its cost grows
  with the age of a subscription.
- The amount field's validation error is rendered but not announced to screen
  readers.