# TandemFit - Couples Fitness App

## Overview
A couples fitness tracking app for Obed and Kristina with shared progress tracking, couple challenges, activity suggestions, meal planning, motivation system, gamification (streaks, badges, rewards), and AI-powered personalized workout generation. Rebranded from FitTogether to TandemFit with custom logo.

## Architecture
- **Frontend**: React + TypeScript + Vite, styled with Tailwind CSS + shadcn/ui
- **Backend**: Express.js REST API
- **Database**: PostgreSQL via Drizzle ORM
- **State Management**: TanStack React Query
- **AI**: OpenAI API (gpt-5-mini) for personalized workout plans and AI recipe generation

## Key Features
1. **Dashboard** - Real-time progress tracking for both partners (weekly workouts, calories burned), motivation feed, active challenges preview
2. **Activities** - AI workout generator with metabolic profiles, workout suggestions (together/individual), filter by type, log workouts for either partner
3. **Meals** - AI recipe generator (cuisine, portions, calories, dietary restrictions), recipe discovery with tags, weekly meal planner with day-by-day tracking
4. **Challenges** - Couple challenges with progress bars, badge collection, reward system
5. **AI Workout Generator** - Personalized workout plans based on partner metabolic profiles (age, height, weight, fitness level, goal), with exercise details (sets, reps, rest, form tips)

## Project Structure
- `shared/schema.ts` - All Drizzle schemas and TypeScript types (partners, workoutLogs, activities, meals, mealPlans, challenges, badges, motivationMessages, aiWorkoutPlans, aiMealPlans)
- `server/routes.ts` - REST API endpoints including OpenAI integration
- `server/storage.ts` - Database storage layer (PostgreSQL)
- `server/seed.ts` - Initial seed data with metabolic profiles
- `client/src/pages/home.tsx` - Main page with tab navigation
- `client/src/components/` - All UI components (header, tabs, dashboard, activities, meals, challenges, ai-workout-generator, ai-meal-generator)

## API Endpoints
- GET/POST `/api/partners`, `/api/activities`, `/api/meals`, `/api/challenges`, `/api/badges`, `/api/messages`, `/api/workout-logs`, `/api/meal-plans`
- PATCH `/api/partners/:id`, `/api/challenges/:id`, `/api/meal-plans/:id`
- DELETE `/api/meals/:id` - Delete a meal (cascades to meal plans)
- DELETE `/api/meal-plans/:id` - Clear a day from the weekly planner
- GET `/api/ai-workout-plans/:partnerId` - Past AI plans for a partner
- POST `/api/ai-workout-plans/generate` - Generate AI workout plan (body: { partnerId, focusArea })
- GET `/api/ai-meal-plans` - All saved AI-generated recipes
- POST `/api/ai-meal-plans/generate` - Generate AI recipe (body: { cuisine, portions, calorieRange, dietaryRestrictions })
- DELETE `/api/ai-meal-plans/:id` - Delete a saved AI recipe

## Recent Changes
- 2026-02-09: Individualized activities - profile switcher in header (localStorage), per-partner workout history, Record Workout with MET-based calorie calculation, smart workout type detection
- 2026-02-09: Rebranded to TandemFit with custom logo, favicon, apple-touch-icon
- 2026-02-08: Added breakfast/lunch/dinner meal type support - weekly planner now shows 3 rows per day, dialog has meal type picker
- 2026-02-08: Added recipe detail view in meal dialog (ingredients, steps) and AI recipe removal after adding to collection
- 2026-02-08: Added ability to add AI recipes to meal collection, delete meals, and clear days from weekly planner
- 2026-02-08: Added AI meal/recipe generator with OpenAI integration, cuisine/portions/calories/dietary restrictions, ingredient lists and step-by-step instructions
- 2026-02-08: Added AI workout generator with OpenAI integration, metabolic profiles for partners, exercise plan generation with reps/sets/form tips
- 2026-02-08: Initial build with all MVP features, PostgreSQL database, seed data

## User Preferences
- Personalized for Obed (blue, 28yo, 178cm, 82kg, muscle building) and Kristina (pink, 26yo, 165cm, 62kg, toning and cardio)
- Dark mode support via theme toggle
- Self-hosted deployment (uses own OpenAI API key via OPENAI_API_KEY secret)
