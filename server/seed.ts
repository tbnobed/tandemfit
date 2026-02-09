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
    storage.createChallenge({ name: "7-Day Couple Challenge", description: "Work out together every day this week", progress: 0, goal: 100, reward: "Golden Hearts Badge", rewardIcon: "Trophy", active: true }),
    storage.createChallenge({ name: "Healthy Meal Streak", description: "Cook 10 healthy meals together", progress: 0, goal: 100, reward: "Master Chef Badge", rewardIcon: "Award", active: true }),
    storage.createChallenge({ name: "Monthly Active Days", description: "Both complete 20 active days", progress: 0, goal: 100, reward: "Power Couple Badge", rewardIcon: "Trophy", active: true }),
  ]);

  console.log("Database seeded successfully!");
}
