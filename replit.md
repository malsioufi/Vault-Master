# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Vault Breaker (Mobile App - Expo)
- **Path**: `artifacts/vault-breaker/`
- **Type**: Expo (React Native) mobile app
- **Preview**: `/` (root)
- **Font**: SpaceMono (monospace for terminal aesthetic)
- **Storage**: AsyncStorage (no backend for game state)

#### Architecture
- `context/GameContext.tsx` — central game state, AI logic, translation system (EN/AR)
- `screens/MenuScreen.tsx` — home screen with settings panel
- `screens/GameScreen.tsx` — active gameplay with digit input numpad, history log
- `screens/ResultScreen.tsx` — win/lose screen with code reveal animation
- `screens/OnlineScreen.tsx` — room creation/joining UI (placeholder)
- `components/DigitInput.tsx` — custom numpad with validation and haptics
- `components/FeedbackIcons.tsx` — randomized Match/Shift/Glitch icons
- `components/GuessRow.tsx` — history entry rows
- `components/GlowText.tsx` — neon glow text component
- `components/ScanlineBackground.tsx` — animated scanline overlay
- `components/TurnTimer.tsx` — countdown timer bar
- `constants/colors.ts` — cyberpunk color palette (#0a0e17 bg, #00ff88 primary, #00d4ff accent)

#### Features
- Solo mode vs AI (Easy/Medium/Hard difficulty using Knuth-style elimination)
- Active Bot mode (AI guesses your code while you guess its code)
- Configurable code length (3/4/5/6 digits), duplicates toggle, max tries
- Randomized feedback icon ordering (Match/Shift/Glitch counts shown, positions hidden)
- 30-second turn timer (auto-submits random guess if expired)
- Surrender option with confirmation
- Full Arabic/English bilingual support
- Scanline animations, glow effects, cyber-terminal aesthetic

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
