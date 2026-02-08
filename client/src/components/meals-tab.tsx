import {
  Calendar, Utensils, Timer, Flame, BarChart3, Salad, Fish, Soup,
  Cookie, Egg, Sandwich, ChefHat, Check, Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Meal, MealPlan } from "@shared/schema";

const mealIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Salad, Fish, Soup, Cookie, Egg, Sandwich, Utensils, ChefHat,
};

function getMealIcon(name: string) {
  return mealIconMap[name] || Utensils;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MealsTabProps {
  meals: Meal[];
  mealPlans: MealPlan[];
  onPlanMeal: (data: { mealId: string; dayOfWeek: number }) => void;
  onToggleMealComplete: (planId: string, completed: boolean) => void;
  isPlanning: boolean;
}

export function MealsTab({ meals, mealPlans, onPlanMeal, onToggleMealComplete, isPlanning }: MealsTabProps) {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");

  const handlePlan = () => {
    if (!selectedMeal || !selectedDay) return;
    onPlanMeal({
      mealId: selectedMeal.id,
      dayOfWeek: parseInt(selectedDay),
    });
    setSelectedMeal(null);
    setSelectedDay("");
  };

  const getMealForDay = (dayIndex: number) => {
    const plan = mealPlans.find((p) => p.dayOfWeek === dayIndex);
    if (!plan || !plan.mealId) return null;
    const meal = meals.find((m) => m.id === plan.mealId);
    return { plan, meal };
  };

  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (d === "Hard") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-meals-title">Meal Planning & Recipes</h2>
        <p className="text-sm text-muted-foreground mt-1">Delicious, healthy meals to cook together</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {meals.map((meal) => {
          const Icon = getMealIcon(meal.iconName);
          return (
            <Card
              key={meal.id}
              className="hover-elevate active-elevate-2 cursor-pointer transition-all"
              onClick={() => setSelectedMeal(meal)}
              data-testid={`card-meal-${meal.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-md bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-chart-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground leading-tight">{meal.name}</h3>
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {(meal.tags || []).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {meal.prepTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {meal.calories} cal
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${difficultyColor(meal.difficulty)}`}>
                    {meal.difficulty}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-chart-3" />
            This Week's Meal Plan
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, idx) => {
              const planned = getMealForDay(idx);
              return (
                <div
                  key={day}
                  className={`text-center p-2 sm:p-3 border border-dashed rounded-md transition-colors cursor-pointer ${
                    planned
                      ? planned.plan.completed
                        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30"
                        : "border-primary/40 bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => {
                    if (planned) {
                      onToggleMealComplete(planned.plan.id, !planned.plan.completed);
                    }
                  }}
                  data-testid={`mealplan-day-${idx}`}
                >
                  <div className="font-semibold text-xs text-muted-foreground mb-1">{day}</div>
                  {planned ? (
                    <div>
                      {planned.plan.completed ? (
                        <Check className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ChefHat className="w-5 h-5 mx-auto text-primary" />
                      )}
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        {planned.meal?.name?.split(" ")[0] || "Meal"}
                      </div>
                    </div>
                  ) : (
                    <Plus className="w-5 h-5 mx-auto text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan: {selectedMeal?.name}</DialogTitle>
            <DialogDescription>
              {selectedMeal?.prepTime} prep, {selectedMeal?.calories} calories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Which day?</label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger data-testid="select-meal-day">
                  <SelectValue placeholder="Pick a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, idx) => (
                    <SelectItem key={idx} value={String(idx)} data-testid={`option-day-${day.toLowerCase()}`}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handlePlan}
              disabled={!selectedDay || isPlanning}
              data-testid="button-confirm-plan"
            >
              {isPlanning ? "Planning..." : "Add to Meal Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
