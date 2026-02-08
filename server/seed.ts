import { storage } from "./storage";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { partners } from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export async function seedDatabase() {
  const existingPartners = await db.select().from(partners);
  if (existingPartners.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  const obed = await storage.createPartner({
    name: "Obed",
    color: "blue",
    weeklyGoal: 5,
    calorieGoal: 2200,
    streak: 12,
    age: 28,
    heightFeet: 5,
    heightInches: 10,
    weightLbs: 181,
    fitnessLevel: "intermediate",
    goal: "muscle building",
  });

  const kristina = await storage.createPartner({
    name: "Kristina",
    color: "pink",
    weeklyGoal: 4,
    calorieGoal: 1900,
    streak: 12,
    age: 26,
    heightFeet: 5,
    heightInches: 5,
    weightLbs: 137,
    fitnessLevel: "intermediate",
    goal: "toning and cardio",
  });

  await Promise.all([
    storage.createActivity({ name: "Morning Hike", type: "Together", duration: "45 min", calories: 350, difficulty: "Medium", iconName: "Mountain" }),
    storage.createActivity({ name: "Couples Yoga", type: "Together", duration: "30 min", calories: 180, difficulty: "Easy", iconName: "PersonStanding" }),
    storage.createActivity({ name: "Dance Class", type: "Together", duration: "60 min", calories: 400, difficulty: "Medium", iconName: "Music" }),
    storage.createActivity({ name: "Bike Ride", type: "Together", duration: "40 min", calories: 320, difficulty: "Easy", iconName: "Bike" }),
    storage.createActivity({ name: "HIIT Workout", type: "Individual", duration: "25 min", calories: 280, difficulty: "Hard", iconName: "Zap" }),
    storage.createActivity({ name: "Swimming", type: "Together", duration: "45 min", calories: 400, difficulty: "Medium", iconName: "Waves" }),
  ]);

  await Promise.all([
    storage.createMeal({ name: "Mediterranean Chicken Bowl", prepTime: "25 min", calories: 450, tags: ["High Protein", "Healthy Fats"], difficulty: "Easy", iconName: "Salad" }),
    storage.createMeal({ name: "Teriyaki Salmon & Veggies", prepTime: "30 min", calories: 520, tags: ["Omega-3", "Low Carb"], difficulty: "Medium", iconName: "Fish" }),
    storage.createMeal({ name: "Veggie Quinoa Power Bowl", prepTime: "20 min", calories: 380, tags: ["Vegetarian", "Fiber Rich"], difficulty: "Easy", iconName: "Salad" }),
    storage.createMeal({ name: "Thai Peanut Stir-Fry", prepTime: "35 min", calories: 420, tags: ["Quick Prep", "Fun to Make"], difficulty: "Medium", iconName: "Soup" }),
    storage.createMeal({ name: "Greek Yogurt Parfait", prepTime: "10 min", calories: 280, tags: ["Breakfast", "Protein"], difficulty: "Easy", iconName: "Egg" }),
    storage.createMeal({ name: "Spicy Shrimp Tacos", prepTime: "30 min", calories: 395, tags: ["Date Night", "Fun to Make"], difficulty: "Medium", iconName: "ChefHat" }),
  ]);

  await Promise.all([
    storage.createChallenge({ name: "7-Day Couple Challenge", description: "Work out together every day this week", progress: 42, goal: 100, reward: "Golden Hearts Badge", rewardIcon: "Trophy", active: true }),
    storage.createChallenge({ name: "Healthy Meal Streak", description: "Cook 10 healthy meals together", progress: 60, goal: 100, reward: "Master Chef Badge", rewardIcon: "Award", active: true }),
    storage.createChallenge({ name: "Monthly Active Days", description: "Both complete 20 active days", progress: 75, goal: 100, reward: "Power Couple Badge", rewardIcon: "Trophy", active: true }),
  ]);

  await Promise.all([
    storage.createBadge({ name: "First Flame", description: "First workout streak", iconName: "Award", weekNumber: 1 }),
    storage.createBadge({ name: "Strong Together", description: "5 workouts together", iconName: "Trophy", weekNumber: 2 }),
    storage.createBadge({ name: "Heart Warriors", description: "10 days active", iconName: "Award", weekNumber: 3 }),
    storage.createBadge({ name: "Rising Stars", description: "Weekly goal met", iconName: "Trophy", weekNumber: 4 }),
    storage.createBadge({ name: "Runners Up", description: "First run logged", iconName: "Award", weekNumber: 5 }),
    storage.createBadge({ name: "Clean Eaters", description: "5 healthy meals cooked", iconName: "Award", weekNumber: 6 }),
  ]);

  await Promise.all([
    storage.createMessage({ message: "You two are crushing it!" }),
    storage.createMessage({ message: "Kristina logged a morning run - time to match her energy!" }),
    storage.createMessage({ message: "12-day streak together! Keep it going!" }),
    storage.createMessage({ message: "You're both 85% to your weekly goal! Almost there!" }),
  ]);

  const now = new Date();
  await Promise.all([
    storage.createWorkoutLog({ partnerId: obed.id, activityName: "Morning Hike", duration: 45, caloriesBurned: 350, loggedAt: new Date(now.getTime() - 1 * 86400000) }),
    storage.createWorkoutLog({ partnerId: obed.id, activityName: "HIIT Workout", duration: 25, caloriesBurned: 280, loggedAt: new Date(now.getTime() - 2 * 86400000) }),
    storage.createWorkoutLog({ partnerId: obed.id, activityName: "Bike Ride", duration: 40, caloriesBurned: 320, loggedAt: now }),
    storage.createWorkoutLog({ partnerId: kristina.id, activityName: "Couples Yoga", duration: 30, caloriesBurned: 180, loggedAt: new Date(now.getTime() - 1 * 86400000) }),
    storage.createWorkoutLog({ partnerId: kristina.id, activityName: "Dance Class", duration: 60, caloriesBurned: 400, loggedAt: new Date(now.getTime() - 2 * 86400000) }),
    storage.createWorkoutLog({ partnerId: kristina.id, activityName: "Swimming", duration: 45, caloriesBurned: 400, loggedAt: now }),
    storage.createWorkoutLog({ partnerId: kristina.id, activityName: "Morning Hike", duration: 45, caloriesBurned: 350, loggedAt: new Date(now.getTime() - 3 * 86400000) }),
    storage.createWorkoutLog({ partnerId: kristina.id, activityName: "Bike Ride", duration: 40, caloriesBurned: 320, loggedAt: new Date(now.getTime() - 4 * 86400000) }),
  ]);

  console.log("Database seeded successfully!");
}
