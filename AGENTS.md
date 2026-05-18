<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Meek Meet — Project Context

## Overview
Meek Meet is a faith-based community organizing platform targeting Bible-believing communities (Catholic, Protestant, Jehovah's Witness, Orthodox, etc.). The core mission: "The meek shall inherit the earth" (Matthew 5:5).

## Design Language
- **Aesthetic**: Institutional / Governmental / Catholic sophistication
- **Palette**: Deep navy (#0A1628), gold accents (#C9A227), cream (#F5F0E8), deep green (#1B4332)
- **Typography**: Playfair Display (serif, headings), Inter (sans, body)
- **Mood**: Authoritative, reverent, structured, elegant

## Architecture
- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Output**: Static export (`output: "export"`)

## Key Features (Landing Page)
1. Hero — Biblical quote with scripture reference
2. Vision — Four pillars: Collect Data, Fight for Change, Empower the Meek, Unite the Faithful
3. How It Works — 6-step funnel from leader signup to advocacy
4. The New Moon — Live countdown to next new moon (auto-calculated)
5. Features — 6 platform capabilities
6. Leader CTA — Registration form with denomination selection

## App Roadmap (Not Yet Built)
- Leader admin dashboard
- Participant mobile app (concerns, questionnaires)
- Dynamic question engine (billion-dollar scale assortment)
- Location-based meet management
- Aggregated reporting system

## File Structure
```
src/app/
  components/
    Navbar.tsx
    HeroSection.tsx
    VisionSection.tsx
    HowItWorks.tsx
    NewMoonSection.tsx
    FeaturesSection.tsx
    LeaderCTA.tsx
    Footer.tsx
  layout.tsx
  page.tsx
  globals.css
```
