# FitTogether - Couples Fitness App

## Overview
A couples fitness tracking app for Obed and Kristina with shared progress tracking, couple challenges, activity suggestions, meal planning, motivation system, and gamification (streaks, badges, rewards).

## Architecture
- **Frontend**: React + TypeScript + Vite, styled with Tailwind CSS + shadcn/ui
- **Backend**: Express.js REST API
- **Database**: PostgreSQL via Drizzle ORM
- **State Management**: TanStack React Query

## Key Features
1. **Dashboard** - Real-time progress tracking for both partners (weekly workouts, calories burned), motivation feed, active challenges preview
2. **Activities** - Workout suggestions (together/individual), filter by type, log workouts for either partner
3. **Meals** - Recipe discovery with tags, weekly meal planner with day-by-day tracking
4. **Challenges** - Couple challenges with progress bars, badge collection, reward system

## Project Structure
- `shared/schema.ts` - All Drizzle schemas and TypeScript types
- `server/routes.ts` - REST API endpoints
- `server/storage.ts` - Database storage layer (PostgreSQL)
- `server/seed.ts` - Initial seed data
- `client/src/pages/home.tsx` - Main page with tab navigation
- `client/src/components/` - All UI components (header, tabs, dashboard, activities, meals, challenges)

## API Endpoints
- GET/POST `/api/partners`, `/api/activities`, `/api/meals`, `/api/challenges`, `/api/badges`, `/api/messages`, `/api/workout-logs`, `/api/meal-plans`
- PATCH `/api/challenges/:id`, `/api/meal-plans/:id`

## Recent Changes
- 2026-02-08: Initial build with all MVP features, PostgreSQL database, seed data

## User Preferences
- Personalized for Obed (blue) and Kristina (pink)
- Dark mode support via theme toggle
