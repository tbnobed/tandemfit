import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("blue"),
  weeklyGoal: integer("weekly_goal").notNull().default(5),
  calorieGoal: integer("calorie_goal").notNull().default(2000),
  streak: integer("streak").notNull().default(0),
  age: integer("age"),
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  fitnessLevel: text("fitness_level").default("intermediate"),
  goal: text("goal").default("general fitness"),
});

export const aiWorkoutPlans = pgTable("ai_workout_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  planName: text("plan_name").notNull(),
  exercises: text("exercises").notNull(),
  totalDuration: text("total_duration").notNull(),
  totalCalories: integer("total_calories").notNull(),
  difficulty: text("difficulty").notNull(),
  focusArea: text("focus_area").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  activityName: text("activity_name").notNull(),
  duration: integer("duration").notNull(),
  caloriesBurned: integer("calories_burned").notNull(),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("Together"),
  duration: text("duration").notNull(),
  calories: integer("calories").notNull(),
  difficulty: text("difficulty").notNull().default("Medium"),
  iconName: text("icon_name").notNull().default("Dumbbell"),
});

export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  prepTime: text("prep_time").notNull(),
  calories: integer("calories").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  difficulty: text("difficulty").notNull().default("Easy"),
  iconName: text("icon_name").notNull().default("Utensils"),
});

export const mealPlans = pgTable("meal_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id"),
  dayOfWeek: integer("day_of_week").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  progress: integer("progress").notNull().default(0),
  goal: integer("goal").notNull().default(100),
  reward: text("reward").notNull(),
  rewardIcon: text("reward_icon").notNull().default("Trophy"),
  active: boolean("active").notNull().default(true),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull().default("Award"),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  weekNumber: integer("week_number").notNull().default(1),
});

export const motivationMessages = pgTable("motivation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  fromPartner: varchar("from_partner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true });
export const insertAiWorkoutPlanSchema = createInsertSchema(aiWorkoutPlans).omit({ id: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true });
export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export const insertMotivationMessageSchema = createInsertSchema(motivationMessages).omit({ id: true });

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type AiWorkoutPlan = typeof aiWorkoutPlans.$inferSelect;
export type InsertAiWorkoutPlan = z.infer<typeof insertAiWorkoutPlanSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type MotivationMessage = typeof motivationMessages.$inferSelect;
export type InsertMotivationMessage = z.infer<typeof insertMotivationMessageSchema>;
