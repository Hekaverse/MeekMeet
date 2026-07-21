# @meekmeet/core

Shared foundation for the Meek Meet platform. This package is consumed by both the Next.js web app and the Capacitor mobile app.

## Contents

- `questions/` — Curated discussion questions, daily verses, and weekly themes.
- `types/` — Shared TypeScript interfaces for circles, meetings, readings, etc.

## Usage

```ts
import { revolutionaryQuestions, questionCategories } from "@meekmeet/core/questions";
import type { Circle, Meeting } from "@meekmeet/core/types";
```

## Adding content

Place new shared content in the appropriate `src/` folder, run `npm run build`, and import from the consuming app. Avoid importing app-specific code into this package.
