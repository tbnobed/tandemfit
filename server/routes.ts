import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWorkoutLogSchema,
  insertMealSchema,
  insertMealPlanSchema,
  insertMotivationMessageSchema,
  insertActivitySchema,
} from "@shared/schema";
import type { Partner } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function calculateEffortPoints(
  caloriesBurned: number,
  duration: number,
  partner: Partner
): number {
  const weightKg = partner.weightLbs ? partner.weightLbs * 0.453592 : 70;

  const baselineWeightKg = 75;
  const weightFactor = baselineWeightKg / weightKg;
  const normalizedCals = caloriesBurned * weightFactor;

  const sexMult = partner.sex === "female" ? 1.15 : 1.0;

  const fitnessMultipliers: Record<string, number> = {
    beginner: 0.85,
    intermediate: 1.0,
    advanced: 1.15,
  };
  const fitnessMult = fitnessMultipliers[partner.fitnessLevel || "intermediate"] || 1.0;

  const age = partner.age || 25;
  const ageMult = 1 + Math.max(0, (age - 25) * 0.005);

  const durationMult = 1 + Math.log10(Math.max(duration, 1)) * 0.1;

  return Math.round(normalizedCals * sexMult * fitnessMult * ageMult * durationMult);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/partners", async (_req, res) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.get("/api/activities", async (_req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const parsed = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(parsed);
      res.json(activity);
    } catch (e) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const parsed = insertActivitySchema.partial().parse(req.body);
      const updated = await storage.updateActivity(req.params.id, parsed);
      if (!updated) return res.status(404).json({ error: "Activity not found" });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      await storage.deleteActivity(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  app.get("/api/meals", async (_req, res) => {
    try {
      const meals = await storage.getMeals();
      res.json(meals);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch meals" });
    }
  });

  app.post("/api/meals", async (req, res) => {
    try {
      const parsed = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal(parsed);
      res.json(meal);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to create meal" });
    }
  });

  app.get("/api/meal-plans", async (_req, res) => {
    try {
      const plans = await storage.getMealPlans();
      res.json(plans);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch meal plans" });
    }
  });

  app.post("/api/meal-plans", async (req, res) => {
    try {
      const parsed = insertMealPlanSchema.parse(req.body);
      const plan = await storage.createMealPlan(parsed);
      res.json(plan);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  });

  app.patch("/api/meal-plans/:id", async (req, res) => {
    try {
      const parsed = insertMealPlanSchema.partial().extend({ completed: z.boolean().optional() }).parse(req.body);
      const plan = await storage.updateMealPlan(req.params.id, parsed);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      res.json(plan);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to update meal plan" });
    }
  });

  app.patch("/api/meals/:id", async (req, res) => {
    try {
      const parsed = insertMealSchema.partial().parse(req.body);
      const meal = await storage.updateMeal(req.params.id, parsed);
      if (!meal) return res.status(404).json({ error: "Meal not found" });
      res.json(meal);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to update meal" });
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      await storage.deleteMeal(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete meal" });
    }
  });

  app.delete("/api/meal-plans/:id", async (req, res) => {
    try {
      await storage.deleteMealPlan(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete meal plan" });
    }
  });

  app.get("/api/challenges", async (_req, res) => {
    try {
      const challenges = await storage.getChallenges();
      const workoutLogs = await storage.getWorkoutLogs();
      const mealPlans = await storage.getMealPlans();
      const partners = await storage.getPartners();

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const enriched = challenges.map((c) => {
        const nameLower = c.name.toLowerCase();

        if (nameLower.includes("meal")) {
          const completedMeals = mealPlans.filter((mp) => mp.completed).length;
          const goal = c.goal || 10;
          return { ...c, progress: Math.min(Math.round((completedMeals / goal) * 100), 100) };
        }

        if (nameLower.includes("monthly") || nameLower.includes("active day")) {
          const partnerDays = partners.map((p) => {
            const uniqueDays = new Set(
              workoutLogs
                .filter((l) => l.partnerId === p.id && new Date(l.loggedAt) >= startOfMonth)
                .map((l) => new Date(l.loggedAt).toDateString())
            );
            return uniqueDays.size;
          });
          const avgDays = partnerDays.length > 0
            ? partnerDays.reduce((a, b) => a + b, 0) / partnerDays.length
            : 0;
          const goal = 20;
          return { ...c, progress: Math.min(Math.round((avgDays / goal) * 100), 100) };
        }

        if (nameLower.includes("couple") || nameLower.includes("7-day") || nameLower.includes("together")) {
          const weekDays = [0, 1, 2, 3, 4, 5, 6];
          let bothWorkedOut = 0;
          for (const dayOffset of weekDays) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + dayOffset);
            if (day > now) break;
            const dayStr = day.toDateString();
            const allPartnersWorked = partners.every((p) =>
              workoutLogs.some(
                (l) => l.partnerId === p.id && new Date(l.loggedAt).toDateString() === dayStr
              )
            );
            if (allPartnersWorked) bothWorkedOut++;
          }
          const daysPassed = Math.min(Math.floor((now.getTime() - startOfWeek.getTime()) / 86400000) + 1, 7);
          return { ...c, progress: Math.min(Math.round((bothWorkedOut / daysPassed) * 100), 100) };
        }

        return c;
      });

      res.json(enriched);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.patch("/api/challenges/:id", async (req, res) => {
    try {
      const { progress } = req.body;
      if (progress === undefined || typeof progress !== "number") {
        return res.status(400).json({ error: "progress (number) required" });
      }
      const challenge = await storage.updateChallengeProgress(req.params.id, progress);
      if (!challenge) return res.status(404).json({ error: "Challenge not found" });
      res.json(challenge);
    } catch (e) {
      res.status(500).json({ error: "Failed to update challenge" });
    }
  });

  app.get("/api/badges", async (_req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.get("/api/messages", async (_req, res) => {
    try {
      const [userMessages, allPartners, allLogs, allChallenges] = await Promise.all([
        storage.getMessages(),
        storage.getPartners(),
        storage.getWorkoutLogs(),
        storage.getChallenges(),
      ]);

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const smartMessages: { message: string; createdAt: string }[] = [];

      const sortedLogs = [...allLogs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

      for (const partner of allPartners) {
        const weeklyLogs = sortedLogs.filter(
          (l) => l.partnerId === partner.id && new Date(l.loggedAt) >= startOfWeek
        );
        const todayLogs = sortedLogs.filter(
          (l) => l.partnerId === partner.id && new Date(l.loggedAt) >= startOfDay
        );
        const weeklyCount = weeklyLogs.length;
        const todayCalories = todayLogs.reduce((s, l) => s + l.caloriesBurned, 0);
        const weeklyCalories = weeklyLogs.reduce((s, l) => s + l.caloriesBurned, 0);

        if (partner.weeklyGoal > 0) {
          const pct = Math.round((weeklyCount / partner.weeklyGoal) * 100);
          if (weeklyCount >= partner.weeklyGoal) {
            smartMessages.push({ message: `${partner.name} hit their weekly goal of ${partner.weeklyGoal} workouts!`, createdAt: now.toISOString() });
          } else if (pct >= 50) {
            smartMessages.push({ message: `${partner.name} is ${pct}% to their weekly workout goal (${weeklyCount}/${partner.weeklyGoal}). Keep pushing!`, createdAt: now.toISOString() });
          } else if (weeklyCount > 0) {
            smartMessages.push({ message: `${partner.name} has ${weeklyCount} workout${weeklyCount > 1 ? "s" : ""} this week. ${partner.weeklyGoal - weeklyCount} more to hit the goal!`, createdAt: now.toISOString() });
          }
        }

        if (todayCalories > 0 && partner.calorieGoal > 0) {
          smartMessages.push({ message: `${partner.name} burned ${todayCalories} calories today. ${todayCalories >= partner.calorieGoal ? "Goal crushed!" : `${partner.calorieGoal - todayCalories} more to hit the daily target.`}`, createdAt: now.toISOString() });
        }

        if (partner.streak >= 14) {
          smartMessages.push({ message: `${partner.name} is on a ${partner.streak}-day streak! Absolutely unstoppable!`, createdAt: now.toISOString() });
        } else if (partner.streak >= 7) {
          smartMessages.push({ message: `${partner.name} has a ${partner.streak}-day streak going. That's a whole week of consistency!`, createdAt: now.toISOString() });
        } else if (partner.streak >= 3) {
          smartMessages.push({ message: `${partner.name} is building momentum with a ${partner.streak}-day streak!`, createdAt: now.toISOString() });
        }

        const lastLog = sortedLogs.find((l) => l.partnerId === partner.id);
        if (lastLog) {
          smartMessages.push({ message: `${partner.name}'s last workout: ${lastLog.activityName} (${lastLog.duration} min, ${lastLog.caloriesBurned} cal)`, createdAt: new Date(lastLog.loggedAt).toISOString() });
        }
      }

      if (allPartners.length === 2) {
        const [p1, p2] = allPartners;
        const p1Weekly = sortedLogs.filter((l) => l.partnerId === p1.id && new Date(l.loggedAt) >= startOfWeek).length;
        const p2Weekly = sortedLogs.filter((l) => l.partnerId === p2.id && new Date(l.loggedAt) >= startOfWeek).length;

        if (p1Weekly > 0 && p2Weekly > 0) {
          smartMessages.push({ message: `Both ${p1.name} and ${p2.name} worked out this week. Couple goals!`, createdAt: now.toISOString() });
        }

        if (p1Weekly > p2Weekly && p2Weekly > 0) {
          smartMessages.push({ message: `${p1.name} is leading with ${p1Weekly} workouts this week. ${p2.name}, time to catch up!`, createdAt: now.toISOString() });
        } else if (p2Weekly > p1Weekly && p1Weekly > 0) {
          smartMessages.push({ message: `${p2.name} is leading with ${p2Weekly} workouts this week. ${p1.name}, time to catch up!`, createdAt: now.toISOString() });
        }

        if (p1.weeklyGoal > 0 && p2.weeklyGoal > 0 && p1Weekly >= p1.weeklyGoal && p2Weekly >= p2.weeklyGoal) {
          smartMessages.push({ message: `Power couple alert! Both partners crushed their weekly goals!`, createdAt: now.toISOString() });
        }
      }

      const activeChallenges = allChallenges.filter((c) => c.active);
      for (const ch of activeChallenges) {
        if (ch.progress >= 100) {
          smartMessages.push({ message: `Challenge complete: "${ch.name}"! Time to claim the ${ch.reward}!`, createdAt: now.toISOString() });
        } else if (ch.progress >= 75) {
          smartMessages.push({ message: `Almost there! "${ch.name}" is at ${ch.progress}%. The finish line is in sight!`, createdAt: now.toISOString() });
        } else if (ch.progress >= 50) {
          smartMessages.push({ message: `Halfway through "${ch.name}" (${ch.progress}%). Keep it up!`, createdAt: now.toISOString() });
        }
      }

      const smartFormatted = smartMessages.slice(0, 10).map((m, i) => ({
        id: `smart-${i}`,
        message: m.message,
        fromPartner: null,
        createdAt: m.createdAt,
      }));

      const combined = [...smartFormatted, ...userMessages];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(combined.slice(0, 20));
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const parsed = insertMotivationMessageSchema.parse(req.body);
      const created = await storage.createMessage(parsed);
      res.json(created);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.get("/api/workout-logs", async (_req, res) => {
    try {
      const logs = await storage.getWorkoutLogs();
      res.json(logs);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch workout logs" });
    }
  });

  app.post("/api/workout-logs", async (req, res) => {
    try {
      const parsed = insertWorkoutLogSchema.parse(req.body);
      const partner = await storage.getPartner(parsed.partnerId);

      let effortPoints = 0;
      if (partner) {
        effortPoints = calculateEffortPoints(parsed.caloriesBurned, parsed.duration, partner);
        await storage.updatePartnerStreak(partner.id, partner.streak + 1);
      }

      const log = await storage.createWorkoutLog({ ...parsed, effortPoints });
      res.json(log);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to log workout" });
    }
  });

  app.patch("/api/workout-logs/:id", async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.caloriesBurned !== undefined || data.duration !== undefined) {
        const existingLogs = await storage.getWorkoutLogs();
        const existingLog = existingLogs.find(l => l.id === req.params.id);
        if (existingLog) {
          const partner = await storage.getPartner(existingLog.partnerId);
          if (partner) {
            const cals = data.caloriesBurned ?? existingLog.caloriesBurned;
            const dur = data.duration ?? existingLog.duration;
            data.effortPoints = calculateEffortPoints(cals, dur, partner);
          }
        }
      }
      const updated = await storage.updateWorkoutLog(req.params.id, data);
      if (!updated) return res.status(404).json({ error: "Workout log not found" });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update workout log" });
    }
  });

  app.delete("/api/workout-logs/:id", async (req, res) => {
    try {
      await storage.deleteWorkoutLog(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete workout log" });
    }
  });

  app.patch("/api/partners/:id", async (req, res) => {
    try {
      const partnerUpdateSchema = z.object({
        age: z.number().nullable().optional(),
        heightFeet: z.number().nullable().optional(),
        heightInches: z.number().nullable().optional(),
        weightLbs: z.number().nullable().optional(),
        fitnessLevel: z.string().optional(),
        sex: z.string().optional(),
        goal: z.string().optional(),
        weeklyGoal: z.number().optional(),
        calorieGoal: z.number().optional(),
      });
      const parsed = partnerUpdateSchema.parse(req.body);
      const updated = await storage.updatePartner(req.params.id, parsed);
      if (!updated) return res.status(404).json({ error: "Partner not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.get("/api/ai-workout-plans/:partnerId", async (req, res) => {
    try {
      const plans = await storage.getAiWorkoutPlans(req.params.partnerId);
      res.json(plans);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch AI workout plans" });
    }
  });

  app.delete("/api/ai-workout-plans/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAiWorkoutPlan(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Plan not found" });
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });

  app.post("/api/ai-workout-plans/generate", async (req, res) => {
    try {
      const { partnerId, focusArea } = req.body;
      if (!partnerId || !focusArea) {
        return res.status(400).json({ error: "partnerId and focusArea are required" });
      }

      const partner = await storage.getPartner(partnerId);
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      const heightStr = partner.heightFeet ? `${partner.heightFeet}'${partner.heightInches || 0}"` : "Not specified";
      const weightStr = partner.weightLbs ? `${partner.weightLbs} lbs` : "Not specified";

      const weightKg = partner.weightLbs ? Math.round(partner.weightLbs * 0.453592) : null;
      const bmr = partner.sex === "female"
        ? (weightKg && partner.age && partner.heightFeet ? Math.round(10 * weightKg + 6.25 * ((partner.heightFeet * 30.48) + (partner.heightInches || 0) * 2.54) - 5 * partner.age - 161) : null)
        : (weightKg && partner.age && partner.heightFeet ? Math.round(10 * weightKg + 6.25 * ((partner.heightFeet * 30.48) + (partner.heightInches || 0) * 2.54) - 5 * partner.age + 5) : null);

      const prompt = `You are a certified personal trainer. Create a personalized workout plan for the following person:

Name: ${partner.name}
Sex: ${partner.sex || "Not specified"}
Age: ${partner.age || "Not specified"}
Height: ${heightStr}
Weight: ${weightStr}${weightKg ? ` (${weightKg} kg)` : ""}
BMR (Mifflin-St Jeor): ${bmr ? `${bmr} kcal/day` : "Not available"}
Fitness Level: ${partner.fitnessLevel || "intermediate"}
Goal: ${partner.goal || "general fitness"}
Daily Calorie Burn Goal: ${partner.calorieGoal}
Focus Area: ${focusArea}

Consider their sex, weight, and BMR when estimating calorie burn for each exercise. ${partner.sex === "female" ? "Women typically have lower muscle mass and BMR, so adjust intensity and calorie estimates accordingly." : ""}

Generate a complete workout plan with 4-6 exercises. For each exercise include the name, sets, reps (or duration for timed exercises), rest period, and a brief form tip.

Respond with JSON in this exact format:
{
  "planName": "descriptive plan name",
  "totalDuration": "estimated total time like 35 min",
  "totalCalories": estimated calories burned as number,
  "difficulty": "Easy" or "Medium" or "Hard",
  "exercises": [
    {
      "name": "exercise name",
      "sets": number,
      "reps": "rep count or duration",
      "restSeconds": number,
      "formTip": "brief technique tip",
      "muscleGroup": "primary muscle group"
    }
  ]
}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      try {
        var response = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      const result = JSON.parse(response.choices[0].message.content || "{}");

      const saved = await storage.createAiWorkoutPlan({
        partnerId,
        planName: result.planName || "Custom Workout",
        exercises: JSON.stringify(result.exercises || []),
        totalDuration: result.totalDuration || "30 min",
        totalCalories: result.totalCalories || 300,
        difficulty: result.difficulty || "Medium",
        focusArea,
      });

      res.json({ ...saved, exercises: result.exercises });
    } catch (e: any) {
      console.error("AI workout generation error:", e);
      res.status(500).json({ error: "Failed to generate workout plan. " + (e.message || "") });
    }
  });

  app.get("/api/ai-meal-plans", async (_req, res) => {
    try {
      const plans = await storage.getAiMealPlans();
      res.json(plans);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch AI meal plans" });
    }
  });

  app.delete("/api/ai-meal-plans/:id", async (req, res) => {
    try {
      await storage.deleteAiMealPlan(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete AI meal plan" });
    }
  });

  const generateMealSchema = z.object({
    cuisine: z.string().min(1),
    portions: z.number().int().min(1).max(10),
    calorieRange: z.string().min(1),
    dietaryRestrictions: z.array(z.string()).optional().default([]),
  });

  app.post("/api/ai-meal-plans/generate", async (req, res) => {
    try {
      const { cuisine, portions, calorieRange, dietaryRestrictions } = generateMealSchema.parse(req.body);

      const restrictionsStr = dietaryRestrictions && dietaryRestrictions.length > 0
        ? `Dietary Restrictions: ${dietaryRestrictions.join(", ")}`
        : "No dietary restrictions";

      const prompt = `You are a professional chef and nutritionist. Create a recipe that meets these requirements:

Cuisine Type: ${cuisine}
Number of Portions: ${portions}
Calorie Range Per Serving: ${calorieRange}
${restrictionsStr}

Generate a complete recipe with a full list of ingredients (with precise measurements) and detailed step-by-step cooking instructions.

Respond with JSON in this exact format:
{
  "recipeName": "descriptive recipe name",
  "prepTime": "preparation time like 15 min",
  "cookTime": "cooking time like 30 min",
  "totalCalories": total calories for entire recipe as number,
  "caloriesPerServing": calories per single serving as number,
  "difficulty": "Easy" or "Medium" or "Hard",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity with unit like 2 cups or 1 tbsp"
    }
  ],
  "steps": [
    "Step 1 description with detailed instructions",
    "Step 2 description with detailed instructions"
  ]
}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      try {
        var response = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      const result = JSON.parse(response.choices[0].message.content || "{}");

      const saved = await storage.createAiMealPlan({
        recipeName: result.recipeName || "Custom Recipe",
        cuisine,
        portions,
        totalCalories: result.totalCalories || 0,
        caloriesPerServing: result.caloriesPerServing || 0,
        dietaryRestrictions: dietaryRestrictions || [],
        prepTime: result.prepTime || "15 min",
        cookTime: result.cookTime || "30 min",
        difficulty: result.difficulty || "Medium",
        ingredients: JSON.stringify(result.ingredients || []),
        steps: JSON.stringify(result.steps || []),
      });

      res.json({ ...saved, ingredients: result.ingredients, steps: result.steps });
    } catch (e: any) {
      console.error("AI meal generation error:", e);
      res.status(500).json({ error: "Failed to generate recipe. " + (e.message || "") });
    }
  });

  app.get("/api/weekly-points", async (_req, res) => {
    try {
      const [allPartners, allLogs] = await Promise.all([
        storage.getPartners(),
        storage.getWorkoutLogs(),
      ]);

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const results = allPartners.map((partner) => {
        const weeklyLogs = allLogs.filter(
          (l) =>
            l.partnerId === partner.id &&
            new Date(l.loggedAt) >= startOfWeek
        );
        const totalPoints = weeklyLogs.reduce((s, l) => s + l.effortPoints, 0);
        const workoutCount = weeklyLogs.length;
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          partnerColor: partner.color,
          totalPoints,
          workoutCount,
        };
      });

      results.sort((a, b) => b.totalPoints - a.totalPoints);

      const weekStart = startOfWeek.toISOString().split("T")[0];
      res.json({ weekStart, results });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch weekly points" });
    }
  });

  app.get("/api/weekly-wins", async (_req, res) => {
    try {
      const wins = await storage.getWeeklyWins();
      res.json(wins);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch weekly wins" });
    }
  });

  app.post("/api/weekly-wins/finalize", async (_req, res) => {
    try {
      const [allPartners, allLogs, existingWins] = await Promise.all([
        storage.getPartners(),
        storage.getWorkoutLogs(),
        storage.getWeeklyWins(),
      ]);

      const now = new Date();
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 7);

      const weekStartStr = lastWeekStart.toISOString().split("T")[0];

      const alreadyFinalized = existingWins.some((w) => w.weekStart === weekStartStr);
      if (alreadyFinalized) {
        return res.json({ message: "Week already finalized", weekStart: weekStartStr });
      }

      const scores = allPartners.map((partner) => {
        const weekLogs = allLogs.filter(
          (l) =>
            l.partnerId === partner.id &&
            new Date(l.loggedAt) >= lastWeekStart &&
            new Date(l.loggedAt) < lastWeekEnd
        );
        return {
          partnerId: partner.id,
          points: weekLogs.reduce((s, l) => s + l.effortPoints, 0),
        };
      });

      scores.sort((a, b) => b.points - a.points);
      const isTie = scores.length >= 2 && scores[0].points === scores[1].points;
      const hasAnyPoints = scores.some(s => s.points > 0);

      if (!hasAnyPoints) {
        return res.json({ message: "No workouts last week, nothing to finalize" });
      }

      const win = await storage.createWeeklyWin({
        weekStart: weekStartStr,
        winnerId: isTie ? null : scores[0].partnerId,
        winnerPoints: scores[0].points,
        runnerUpPoints: scores.length >= 2 ? scores[1].points : 0,
        isTie,
      });

      res.json(win);
    } catch (e) {
      res.status(500).json({ error: "Failed to finalize weekly results" });
    }
  });

  return httpServer;
}
