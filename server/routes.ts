import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWorkoutLogSchema,
  insertMealPlanSchema,
  insertMotivationMessageSchema,
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  app.get("/api/meals", async (_req, res) => {
    try {
      const meals = await storage.getMeals();
      res.json(meals);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch meals" });
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
      const plan = await storage.updateMealPlan(req.params.id, req.body);
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      res.json(plan);
    } catch (e) {
      res.status(500).json({ error: "Failed to update meal plan" });
    }
  });

  app.get("/api/challenges", async (_req, res) => {
    try {
      const challenges = await storage.getChallenges();
      res.json(challenges);
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
      const messages = await storage.getMessages();
      res.json(messages);
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
      const log = await storage.createWorkoutLog(parsed);

      const partner = await storage.getPartner(parsed.partnerId);
      if (partner) {
        await storage.updatePartnerStreak(partner.id, partner.streak + 1);
      }

      res.json(log);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: "Failed to log workout" });
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
        goal: z.string().optional(),
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

      const prompt = `You are a certified personal trainer. Create a personalized workout plan for the following person:

Name: ${partner.name}
Age: ${partner.age || "Not specified"}
Height: ${heightStr}
Weight: ${weightStr}
Fitness Level: ${partner.fitnessLevel || "intermediate"}
Goal: ${partner.goal || "general fitness"}
Daily Calorie Goal: ${partner.calorieGoal}
Focus Area: ${focusArea}

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

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
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

  return httpServer;
}
