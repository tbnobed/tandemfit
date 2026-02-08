import {
  Calendar, Utensils, Timer, Flame, BarChart3, Salad, Fish, Soup,
  Cookie, Egg, Sandwich, ChefHat, Check, Plus, Trash2, X,
  ShoppingBasket, UtensilsCrossed
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Meal, MealPlan } from "@shared/schema";
import { AiMealGenerator } from "./ai-meal-generator";

interface Ingredient {
  item: string;
  amount: string;
}

const mealIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Salad, Fish, Soup, Cookie, Egg, Sandwich, Utensils, ChefHat,
};

function getMealIcon(name: string) {
  return mealIconMap[name] || Utensils;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const MEAL_TYPE_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

interface MealsTabProps {
  meals: Meal[];
  mealPlans: MealPlan[];
  onPlanMeal: (data: { mealId: string; dayOfWeek: number; mealType: string }) => void;
  onToggleMealComplete: (planId: string, completed: boolean) => void;
  onDeleteMeal: (id: string) => void;
  onDeleteMealPlan: (id: string) => void;
  isPlanning: boolean;
}

export function MealsTab({ meals, mealPlans, onPlanMeal, onToggleMealComplete, onDeleteMeal, onDeleteMealPlan, isPlanning }: MealsTabProps) {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<string>("dinner");

  const handlePlan = () => {
    if (!selectedMeal || !selectedDay) return;
    onPlanMeal({
      mealId: selectedMeal.id,
      dayOfWeek: parseInt(selectedDay),
      mealType: selectedMealType,
    });
    setSelectedMeal(null);
    setSelectedDay("");
    setSelectedMealType("dinner");
  };

  const getMealForSlot = (dayIndex: number, mealType: string) => {
    const plan = mealPlans.find((p) => p.dayOfWeek === dayIndex && p.mealType === mealType);
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
    <div className="space-y-8 min-w-0">
      <AiMealGenerator />

      <div className="border-t pt-8">
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
                  <Button
                    size="icon"
                    variant="ghost"
                    data-testid={`button-delete-meal-${meal.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMeal(meal.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-2 w-20"></th>
                  {DAYS.map((day) => (
                    <th key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map((mealType) => (
                  <tr key={mealType}>
                    <td className="p-1.5 text-xs font-medium text-muted-foreground align-middle">{MEAL_TYPE_LABELS[mealType]}</td>
                    {DAYS.map((_day, dayIdx) => {
                      const planned = getMealForSlot(dayIdx, mealType);
                      return (
                        <td key={dayIdx} className="p-1 overflow-visible">
                          <div
                            className={`relative text-center p-2 border border-dashed rounded-md transition-colors cursor-pointer min-h-[56px] flex flex-col items-center justify-center ${
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
                            data-testid={`mealplan-${mealType}-${dayIdx}`}
                          >
                            {planned && (
                              <button
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMealPlan(planned.plan.id);
                                }}
                                data-testid={`button-clear-${mealType}-${dayIdx}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            {planned ? (
                              <div>
                                {planned.plan.completed ? (
                                  <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <ChefHat className="w-4 h-4 mx-auto text-primary" />
                                )}
                                <div className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[60px]">
                                  {planned.meal?.name?.split(" ")[0] || "Meal"}
                                </div>
                              </div>
                            ) : (
                              <Plus className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="text-meal-dialog-title">{selectedMeal?.name}</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Prep: {selectedMeal?.prepTime}</span>
                {selectedMeal?.cookTime && (
                  <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" /> Cook: {selectedMeal.cookTime}</span>
                )}
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {selectedMeal?.calories} cal</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${difficultyColor(selectedMeal?.difficulty || "Easy")}`}>
                  {selectedMeal?.difficulty}
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>

          {(() => {
            let parsedIngredients: Ingredient[] | null = null;
            let parsedSteps: string[] | null = null;
            try {
              if (selectedMeal?.ingredients) parsedIngredients = JSON.parse(selectedMeal.ingredients);
              if (selectedMeal?.steps) parsedSteps = JSON.parse(selectedMeal.steps);
            } catch {}

            if (!parsedIngredients && !parsedSteps) return null;

            return (
              <div className="space-y-4 pt-2">
                {parsedIngredients && parsedIngredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <ShoppingBasket className="w-4 h-4 text-emerald-500" />
                      Ingredients
                    </h4>
                    <div className="space-y-1.5">
                      {parsedIngredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-muted/40 rounded-md text-sm" data-testid={`meal-ingredient-${i}`}>
                          <span className="font-medium text-foreground min-w-[80px]">{ing.amount}</span>
                          <span className="text-muted-foreground">{ing.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {parsedSteps && parsedSteps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                      Instructions
                    </h4>
                    <div className="space-y-2">
                      {parsedSteps.map((step, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-muted/40 rounded-md" data-testid={`meal-step-${i}`}>
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="space-y-4 pt-2 border-t">
            <label className="text-sm font-medium text-foreground block">Add to weekly plan</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Day</label>
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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meal</label>
                <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                  <SelectTrigger data-testid="select-meal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((mt) => (
                      <SelectItem key={mt} value={mt} data-testid={`option-mealtype-${mt}`}>
                        {MEAL_TYPE_LABELS[mt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
