import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWorkoutLogSchema,
  insertMealPlanSchema,
  insertMotivationMessageSchema,
} from "@shared/schema";
import { z } from "zod";

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

  return httpServer;
}
