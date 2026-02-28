# Design: User Acquisition Features — Free Mini-Exam & Readiness Card

**Date:** 2026-02-28
**Status:** Approved
**Target users:** Immigrants/expats preparing for YKI (Finnish), Swedex (Swedish), or PD3 (Danish) exams
**Acquisition channels:** SEO / free public tools + word-of-mouth in immigrant communities

---

## Problem

New users don't find the app unless they already know it exists. The three biggest anxieties for immigrants preparing for language exams are:

- **B. "Am I ready for my exam date?"** — they've booked the exam and need a signal
- **C. "I don't understand the exam format"** — they've never seen what YKI actually looks like
- **D. "I'm studying alone with no one to compare with"** — isolation, no external motivation

---

## Solution

Two complementary features that address all three anxieties:

1. **Free Public Mini-Exam** — drives SEO discovery and converts strangers into users
2. **Shareable Exam Readiness Card** — drives word-of-mouth through immigrant social communities

---

## Feature 1: Free Public Mini-Exam

### Route
`/free-test` — publicly accessible, no authentication required.

### Flow

1. **Language + level selection** — user picks language (Finnish / Swedish / Danish) and level (A1 / B1 / B2)
2. **Mini-exam** — 4 sections, 1 task each, ~10 minutes total:
   - Reading: 1 short text + 2 multiple-choice questions (auto-scored)
   - Listening: 1 audio clip + 2 multiple-choice questions (auto-scored)
   - Speaking: 1 prompt displayed on screen — recorded response optional, not graded
   - Writing: 1 short prompt — user types ~50 words, not graded (grading requires account)
3. **Results page** — section scores for reading/listening, CEFR band estimate, summary message:
   > *"Based on this mini-test, you're around B1. The real YKI exam is 3 hours — sign up to prepare fully."*
4. **CTA** — "Create a free account to continue preparing" → sign-up flow

### Content source
Served from the existing ContentPool (pre-generated, no live AI calls for guests). Reading and listening are auto-scored client-side. Speaking/writing display prompts only.

### Data
No data saved for guests — purely client-side session state.

### SEO value
Page targets high-intent searches: "free YKI practice test", "YKI sample test online", "Swedex practice test free".

---

## Feature 2: Shareable Exam Readiness Card

### Setup
- User sets exam date and target level in Onboarding or Settings
- If not set, dashboard shows a prompt: *"Set your exam date to track your readiness"*

### Readiness score formula
Simple, transparent 0–100% score:

| Factor | Weight |
|--------|--------|
| Average score across last 10 practice sessions | 40% |
| Section coverage (practiced all 4 sections in last 14 days) | 30% |
| Practice consistency (days practiced / 14 in last 14 days) | 30% |

### Dashboard widget
- Readiness percentage displayed in a progress ring
- Exam countdown: "21 days to go"
- Weak section callout: *"Your weakest section is Listening — practice it today"*
- "Share your progress" button

### Shareable card
Generated client-side as a PNG (via `html2canvas` or equivalent):

```
┌─────────────────────────────────┐
│  🇫🇮  YKI Prep Master           │
│  [Name] · YKI B1 · 21 days to go│
│                                 │
│         78% Ready               │
│    ████████████░░░░             │
│                                 │
│  Reading ✓  Listening ⚠        │
│  Speaking ✓  Writing ✓         │
│                                 │
│  ykiprepmaster.com              │
└─────────────────────────────────┘
```

### Sharing mechanism
- **Mobile:** Web Share API (native share sheet)
- **Desktop fallback:** Copy link + download image button

---

## Architecture notes

- Free mini-exam is a new page (`src/pages/FreeTest.jsx`) added to the router with `requiresAuth: false`
- Readiness score calculation runs client-side in a utility function (`src/utils/readinessScore.js`)
- Dashboard widget is a new component (`src/components/dashboard/ReadinessCard.jsx`)
- Card image generation uses `html2canvas` (new dependency) or a hidden styled `div` rendered to canvas
- Exam date stored on the User entity (new field: `exam_date`, `target_level_goal`)

---

## Success metrics

- Free mini-exam: conversion rate from `/free-test` completion → account creation (target: >15%)
- Readiness card: shares per active user per week (target: >1 share per 10 active users)
- Organic traffic to `/free-test` via search engines within 30 days of launch
