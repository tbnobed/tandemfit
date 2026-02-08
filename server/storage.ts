import {
  type Partner, type InsertPartner,
  type WorkoutLog, type InsertWorkoutLog,
  type Activity, type InsertActivity,
  type Meal, type InsertMeal,
  type MealPlan, type InsertMealPlan,
  type Challenge, type InsertChallenge,
  type Badge, type InsertBadge,
  type MotivationMessage, type InsertMotivationMessage,
  type AiWorkoutPlan, type InsertAiWorkoutPlan,
  type AiMealPlan, type InsertAiMealPlan,
  partners, workoutLogs, activities, meals, mealPlans, challenges, badges, motivationMessages, aiWorkoutPlans, aiMealPlans
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export interface IStorage {
  getPartners(): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartnerStreak(id: string, streak: number): Promise<Partner | undefined>;

  getWorkoutLogs(): Promise<WorkoutLog[]>;
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;

  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<void>;

  getMeals(): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;

  getMealPlans(): Promise<MealPlan[]>;
  createMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: string, data: Partial<InsertMealPlan & { completed: boolean }>): Promise<MealPlan | undefined>;

  getChallenges(): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallengeProgress(id: string, progress: number): Promise<Challenge | undefined>;

  getBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;

  getMessages(): Promise<MotivationMessage[]>;
  createMessage(message: InsertMotivationMessage): Promise<MotivationMessage>;

  updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined>;
  getAiWorkoutPlans(partnerId: string): Promise<AiWorkoutPlan[]>;
  createAiWorkoutPlan(plan: InsertAiWorkoutPlan): Promise<AiWorkoutPlan>;
  getAiMealPlans(): Promise<AiMealPlan[]>;
  createAiMealPlan(plan: InsertAiMealPlan): Promise<AiMealPlan>;
  deleteAiMealPlan(id: string): Promise<void>;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getPartners(): Promise<Partner[]> {
    return db.select().from(partners);
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [created] = await db.insert(partners).values(partner).returning();
    return created;
  }

  async updatePartnerStreak(id: string, streak: number): Promise<Partner | undefined> {
    const [updated] = await db.update(partners).set({ streak }).where(eq(partners.id, id)).returning();
    return updated;
  }

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    return db.select().from(workoutLogs).orderBy(desc(workoutLogs.loggedAt));
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const [created] = await db.insert(workoutLogs).values(log).returning();
    return created;
  }

  async getActivities(): Promise<Activity[]> {
    return db.select().from(activities);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updated] = await db.update(activities).set(data).where(eq(activities.id, id)).returning();
    return updated;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async getMeals(): Promise<Meal[]> {
    return db.select().from(meals);
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [created] = await db.insert(meals).values(meal).returning();
    return created;
  }

  async getMealPlans(): Promise<MealPlan[]> {
    return db.select().from(mealPlans);
  }

  async createMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const existing = await db.select().from(mealPlans).where(eq(mealPlans.dayOfWeek, plan.dayOfWeek));
    if (existing.length > 0) {
      const [updated] = await db.update(mealPlans)
        .set({ mealId: plan.mealId, completed: false })
        .where(eq(mealPlans.dayOfWeek, plan.dayOfWeek))
        .returning();
      return updated;
    }
    const [created] = await db.insert(mealPlans).values(plan).returning();
    return created;
  }

  async updateMealPlan(id: string, data: Partial<InsertMealPlan & { completed: boolean }>): Promise<MealPlan | undefined> {
    const [updated] = await db.update(mealPlans).set(data).where(eq(mealPlans.id, id)).returning();
    return updated;
  }

  async getChallenges(): Promise<Challenge[]> {
    return db.select().from(challenges);
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [created] = await db.insert(challenges).values(challenge).returning();
    return created;
  }

  async updateChallengeProgress(id: string, progress: number): Promise<Challenge | undefined> {
    const [updated] = await db.update(challenges).set({ progress }).where(eq(challenges.id, id)).returning();
    return updated;
  }

  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges).orderBy(badges.weekNumber);
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }

  async getMessages(): Promise<MotivationMessage[]> {
    return db.select().from(motivationMessages).orderBy(desc(motivationMessages.createdAt));
  }

  async createMessage(message: InsertMotivationMessage): Promise<MotivationMessage> {
    const [created] = await db.insert(motivationMessages).values(message).returning();
    return created;
  }

  async updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [updated] = await db.update(partners).set(data).where(eq(partners.id, id)).returning();
    return updated;
  }

  async getAiWorkoutPlans(partnerId: string): Promise<AiWorkoutPlan[]> {
    return db.select().from(aiWorkoutPlans).where(eq(aiWorkoutPlans.partnerId, partnerId)).orderBy(desc(aiWorkoutPlans.createdAt));
  }

  async createAiWorkoutPlan(plan: InsertAiWorkoutPlan): Promise<AiWorkoutPlan> {
    const [created] = await db.insert(aiWorkoutPlans).values(plan).returning();
    return created;
  }

  async deleteAiWorkoutPlan(id: string): Promise<boolean> {
    const result = await db.delete(aiWorkoutPlans).where(eq(aiWorkoutPlans.id, id)).returning();
    return result.length > 0;
  }

  async getAiMealPlans(): Promise<AiMealPlan[]> {
    return db.select().from(aiMealPlans).orderBy(desc(aiMealPlans.createdAt));
  }

  async createAiMealPlan(plan: InsertAiMealPlan): Promise<AiMealPlan> {
    const [created] = await db.insert(aiMealPlans).values(plan).returning();
    return created;
  }

  async deleteAiMealPlan(id: string): Promise<void> {
    await db.delete(aiMealPlans).where(eq(aiMealPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
