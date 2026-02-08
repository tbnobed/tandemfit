import {
  Calendar, Utensils, Timer, Flame, Salad, Fish, Soup,
  Cookie, Egg, Sandwich, ChefHat, Check, Plus, Trash2, X,
  ShoppingBasket, UtensilsCrossed, Pencil, ChevronDown, ShoppingCart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const ICON_OPTIONS = ["Utensils", "Salad", "Fish", "Soup", "Cookie", "Egg", "Sandwich", "ChefHat"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const MEAL_TYPE_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

interface MealsTabProps {
  meals: Meal[];
  mealPlans: MealPlan[];
  onPlanMeal: (data: { mealId: string; dayOfWeek: number; mealType: string }) => void;
  onToggleMealComplete: (planId: string, completed: boolean) => void;
  onCreateMeal: (data: { name: string; prepTime: string; calories: number; tags: string[]; difficulty: string; iconName: string; cookTime?: string; ingredients?: string; steps?: string }) => void;
  onUpdateMeal: (id: string, data: Partial<{ name: string; prepTime: string; calories: number; tags: string[]; difficulty: string; iconName: string; cookTime?: string; ingredients?: string; steps?: string }>) => void;
  onDeleteMeal: (id: string) => void;
  onDeleteMealPlan: (id: string) => void;
  isPlanning: boolean;
  isSaving: boolean;
}

type DialogMode = "view" | "edit" | "create" | "picker";

interface SlotTarget {
  dayOfWeek: number;
  mealType: string;
}

export function MealsTab({ meals, mealPlans, onPlanMeal, onToggleMealComplete, onCreateMeal, onUpdateMeal, onDeleteMeal, onDeleteMealPlan, isPlanning, isSaving }: MealsTabProps) {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("view");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<string>("dinner");
  const [slotTarget, setSlotTarget] = useState<SlotTarget | null>(null);

  const [formName, setFormName] = useState("");
  const [formPrepTime, setFormPrepTime] = useState("");
  const [formCookTime, setFormCookTime] = useState("");
  const [formCalories, setFormCalories] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("Easy");
  const [formIcon, setFormIcon] = useState("Utensils");
  const [formTags, setFormTags] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formSteps, setFormSteps] = useState("");
  const [shoppingListExpanded, setShoppingListExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const openViewDialog = (meal: Meal) => {
    setSelectedMeal(meal);
    setDialogMode("view");
    setSelectedDay("");
    setSelectedMealType("dinner");
    setSlotTarget(null);
  };

  const openCreateDialog = (slot?: SlotTarget) => {
    setSelectedMeal(null);
    setDialogMode("create");
    setSlotTarget(slot || null);
    setFormName("");
    setFormPrepTime("15 min");
    setFormCookTime("");
    setFormCalories("");
    setFormDifficulty("Easy");
    setFormIcon("Utensils");
    setFormTags("");
    setFormIngredients("");
    setFormSteps("");
  };

  const openEditDialog = (meal: Meal) => {
    setSelectedMeal(meal);
    setDialogMode("edit");
    setFormName(meal.name);
    setFormPrepTime(meal.prepTime);
    setFormCookTime(meal.cookTime || "");
    setFormCalories(String(meal.calories));
    setFormDifficulty(meal.difficulty);
    setFormIcon(meal.iconName);
    setFormTags((meal.tags || []).join(", "));

    let ingredientText = "";
    let stepsText = "";
    try {
      if (meal.ingredients) {
        const parsed: Ingredient[] = JSON.parse(meal.ingredients);
        ingredientText = parsed.map(i => `${i.amount} - ${i.item}`).join("\n");
      }
      if (meal.steps) {
        const parsed: string[] = JSON.parse(meal.steps);
        stepsText = parsed.join("\n");
      }
    } catch {}
    setFormIngredients(ingredientText);
    setFormSteps(stepsText);
  };

  const openPickerDialog = (slot: SlotTarget) => {
    setDialogMode("picker");
    setSlotTarget(slot);
    setSelectedMeal(null);
  };

  const closeDialog = () => {
    setSelectedMeal(null);
    setDialogMode("view");
    setSlotTarget(null);
  };

  const parseIngredientsText = (text: string): Ingredient[] => {
    if (!text.trim()) return [];
    return text.split("\n").filter(l => l.trim()).map(line => {
      const dashIdx = line.indexOf("-");
      if (dashIdx > 0) {
        return { amount: line.slice(0, dashIdx).trim(), item: line.slice(dashIdx + 1).trim() };
      }
      return { amount: "", item: line.trim() };
    });
  };

  const parseStepsText = (text: string): string[] => {
    if (!text.trim()) return [];
    return text.split("\n").filter(l => l.trim());
  };

  const handleSave = () => {
    if (!formName.trim() || !formCalories) return;
    const ingredients = parseIngredientsText(formIngredients);
    const steps = parseStepsText(formSteps);
    const tags = formTags.split(",").map(t => t.trim()).filter(Boolean);
    const data = {
      name: formName.trim(),
      prepTime: formPrepTime || "15 min",
      calories: parseInt(formCalories),
      tags,
      difficulty: formDifficulty,
      iconName: formIcon,
      cookTime: formCookTime || undefined,
      ingredients: ingredients.length > 0 ? JSON.stringify(ingredients) : undefined,
      steps: steps.length > 0 ? JSON.stringify(steps) : undefined,
    };

    if (dialogMode === "edit" && selectedMeal) {
      onUpdateMeal(selectedMeal.id, data);
    } else {
      onCreateMeal(data);
    }
    closeDialog();
  };

  const handlePlan = () => {
    if (!selectedMeal || !selectedDay) return;
    onPlanMeal({
      mealId: selectedMeal.id,
      dayOfWeek: parseInt(selectedDay),
      mealType: selectedMealType,
    });
    closeDialog();
  };

  const handlePickMeal = (meal: Meal) => {
    if (!slotTarget) return;
    onPlanMeal({
      mealId: meal.id,
      dayOfWeek: slotTarget.dayOfWeek,
      mealType: slotTarget.mealType,
    });
    closeDialog();
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

  const isFormOpen = dialogMode === "view" && !!selectedMeal || dialogMode === "edit" || dialogMode === "create" || dialogMode === "picker";

  return (
    <div className="space-y-8 min-w-0">
      <AiMealGenerator />

      <div className="border-t pt-8">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-meals-title">Meal Planning & Recipes</h2>
            <p className="text-sm text-muted-foreground mt-1">Delicious, healthy meals to cook together</p>
          </div>
          <Button onClick={() => openCreateDialog()} data-testid="button-add-recipe">
            <Plus className="w-4 h-4 mr-1" /> Add Recipe
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
        {meals.map((meal) => {
          const Icon = getMealIcon(meal.iconName);
          return (
            <Card
              key={meal.id}
              className="hover-elevate cursor-pointer"
              onClick={() => openViewDialog(meal)}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-edit-meal-${meal.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(meal);
                      }}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
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
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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
                                if (planned.meal) {
                                  openViewDialog(planned.meal);
                                } else {
                                  onToggleMealComplete(planned.plan.id, !planned.plan.completed);
                                }
                              } else {
                                openPickerDialog({ dayOfWeek: dayIdx, mealType });
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
                              (() => {
                                const SlotIcon = planned.plan.completed
                                  ? Check
                                  : planned.meal ? getMealIcon(planned.meal.iconName) : ChefHat;
                                return (
                                  <div>
                                    <SlotIcon className={`w-4 h-4 mx-auto ${planned.plan.completed ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`} />
                                    <div className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[60px]">
                                      {planned.meal?.name?.split(" ")[0] || "Meal"}
                                    </div>
                                  </div>
                                );
                              })()
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

      {(() => {
        const plannedMeals = mealPlans
          .filter(p => p.mealId)
          .map(p => meals.find(m => m.id === p.mealId))
          .filter((m): m is Meal => !!m);

        const cleanItemName = (raw: string) => {
          let name = raw.split(",")[0].trim();
          name = name.replace(/\s*\(.*?\)\s*/g, "");
          name = name.replace(/\b(fresh|freshly|washed|chopped|diced|minced|sliced|grated|peeled|crushed|dried|ground|roughly|finely|thinly|cubed|shredded|julienned|halved|quartered|trimmed|deseeded|seeded|pitted|cored|zested|melted|softened|toasted|roasted|cooked|uncooked|raw|boneless|skinless|frozen|thawed|canned|drained|packed|sifted|beaten|whisked|room temperature|at room temperature|to taste|optional|for garnish|for serving|as needed)\b/gi, "");
          name = name.replace(/\s{2,}/g, " ").trim();
          return name;
        };

        const mealCounts = new Map<string, number>();
        mealPlans.filter(p => p.mealId).forEach(p => {
          mealCounts.set(p.mealId!, (mealCounts.get(p.mealId!) || 0) + 1);
        });

        const parseFraction = (s: string): number => {
          if (s.includes("/")) {
            const [n, d] = s.split("/");
            return parseFloat(n) / parseFloat(d);
          }
          return parseFloat(s);
        };

        const parseAmount = (amt: string): { num: number; unit: string } | null => {
          let trimmed = amt.trim();
          trimmed = trimmed.replace(/\s*\(.*?\)\s*/g, " ").trim();
          trimmed = trimmed.replace(/,.*$/, "").trim();
          const mixedMatch = trimmed.match(/^(\d+)\s+(\d+\/\d+)\s*(.*)/);
          if (mixedMatch) {
            const num = parseFloat(mixedMatch[1]) + parseFraction(mixedMatch[2]);
            if (!isNaN(num)) return { num, unit: mixedMatch[3].trim().toLowerCase() };
          }
          const simpleMatch = trimmed.match(/^([\d./]+)\s*(.*)/);
          if (simpleMatch) {
            const num = parseFraction(simpleMatch[1]);
            if (!isNaN(num)) return { num, unit: simpleMatch[2].trim().toLowerCase() };
          }
          return null;
        };

        const normalizeUnit = (u: string): string => {
          const s = u.toLowerCase().replace(/\.$/, "");
          const map: Record<string, string> = {
            cup: "cups", c: "cups",
            tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
            tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
            oz: "oz", ounce: "oz", ounces: "oz",
            lb: "lbs", lbs: "lbs", pound: "lbs", pounds: "lbs",
            g: "g", gram: "g", grams: "g",
            kg: "kg", kilogram: "kg", kilograms: "kg",
            ml: "ml", milliliter: "ml", milliliters: "ml", millilitres: "ml",
            l: "l", liter: "l", liters: "l", litres: "l", litre: "l",
            clove: "cloves", cloves: "cloves",
            slice: "slices", slices: "slices",
            piece: "pieces", pieces: "pieces",
            can: "cans", cans: "cans",
            bunch: "bunches", bunches: "bunches",
            sprig: "sprigs", sprigs: "sprigs",
            pinch: "pinches", pinches: "pinches",
            dash: "dashes", dashes: "dashes",
            handful: "handfuls", handfuls: "handfuls",
            large: "large", medium: "medium", small: "small",
          };
          return map[s] || s;
        };

        const ingredientMap = new Map<string, Map<string, number>>();
        mealPlans.filter(p => p.mealId).forEach(plan => {
          const meal = meals.find(m => m.id === plan.mealId);
          if (!meal?.ingredients) return;
          try {
            const parsed: Ingredient[] = JSON.parse(meal.ingredients);
            parsed.forEach(ing => {
              const cleaned = cleanItemName(ing.item);
              const key = cleaned.toLowerCase().trim();
              if (!key) return;
              const unitMap = ingredientMap.get(key) || new Map<string, number>();
              const p = parseAmount(ing.amount);
              if (p) {
                const unit = normalizeUnit(p.unit);
                const existing = unitMap.get(unit) || 0;
                unitMap.set(unit, existing + p.num);
              } else {
                const raw = ing.amount.trim().toLowerCase() || "as needed";
                const existing = unitMap.get(raw) || 0;
                unitMap.set(raw, existing + 1);
              }
              ingredientMap.set(key, unitMap);
            });
          } catch {}
        });

        const formatQuantity = (unitMap: Map<string, number>): string => {
          const parts: string[] = [];
          unitMap.forEach((num, unit) => {
            if (unit === "as needed") {
              parts.push("as needed");
            } else {
              const display = num % 1 === 0 ? num.toString() : num.toFixed(1).replace(/\.0$/, "");
              parts.push(unit ? `${display} ${unit}` : display);
            }
          });
          return parts.join(", ");
        };

        const shoppingItems = Array.from(ingredientMap.entries())
          .map(([item, unitMap]) => ({
            item: item.charAt(0).toUpperCase() + item.slice(1),
            quantity: formatQuantity(unitMap),
          }))
          .sort((a, b) => a.item.localeCompare(b.item));

        return (
          <Card>
            <CardContent className="p-0">
              <div
                className="flex items-center justify-between gap-3 p-4 cursor-pointer flex-wrap"
                onClick={() => setShoppingListExpanded(!shoppingListExpanded)}
                data-testid="button-toggle-shopping-list"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-chart-3" />
                  <span className="font-bold text-sm text-foreground">Weekly Shopping List</span>
                  {shoppingItems.length > 0 && (
                    <Badge variant="secondary">
                      {checkedItems.size > 0
                        ? `${Math.min(checkedItems.size, shoppingItems.length)}/${shoppingItems.length}`
                        : `${shoppingItems.length} items`}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${shoppingListExpanded ? "rotate-180" : ""}`} />
              </div>

              {shoppingListExpanded && (
                <div className="px-4 pb-4">
                  {shoppingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-shopping-items">
                      Plan some meals for the week to generate your shopping list.
                    </p>
                  ) : (
                    <div className="space-y-1.5" data-testid="shopping-list-items">
                      {shoppingItems.map((item, i) => {
                        const isChecked = checkedItems.has(item.item.toLowerCase());
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-2.5 rounded-md text-sm cursor-pointer transition-colors ${isChecked ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/40"}`}
                            onClick={() => {
                              const next = new Set(checkedItems);
                              const key = item.item.toLowerCase();
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              setCheckedItems(next);
                            }}
                            data-testid={`shopping-item-${i}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"}`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`font-medium transition-colors ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.item}</span>
                            <span className={`ml-auto text-xs whitespace-nowrap transition-colors ${isChecked ? "line-through text-muted-foreground/60" : "text-muted-foreground"}`}>{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <Dialog open={isFormOpen} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {dialogMode === "picker" && slotTarget && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-picker-title">
                  Choose a Recipe for {DAYS[slotTarget.dayOfWeek]} {MEAL_TYPE_LABELS[slotTarget.mealType]}
                </DialogTitle>
                <DialogDescription>Pick from your recipe collection or create a new one</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {meals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recipes yet. Create one first!</p>
                )}
                {meals.map((meal) => {
                  const Icon = getMealIcon(meal.iconName);
                  return (
                    <div
                      key={meal.id}
                      className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover-elevate border border-border"
                      onClick={() => handlePickMeal(meal)}
                      data-testid={`picker-meal-${meal.id}`}
                    >
                      <div className="w-9 h-9 rounded-md bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-chart-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">{meal.calories} cal &middot; {meal.prepTime}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full" onClick={() => openCreateDialog(slotTarget)} data-testid="button-create-from-picker">
                <Plus className="w-4 h-4 mr-1" /> Create New Recipe
              </Button>
            </>
          )}

          {dialogMode === "view" && selectedMeal && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-meal-dialog-title">{selectedMeal.name}</DialogTitle>
                <DialogDescription>
                  <span className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Prep: {selectedMeal.prepTime}</span>
                    {selectedMeal.cookTime && (
                      <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" /> Cook: {selectedMeal.cookTime}</span>
                    )}
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {selectedMeal.calories} cal</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${difficultyColor(selectedMeal.difficulty)}`}>
                      {selectedMeal.difficulty}
                    </span>
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedMeal)} data-testid="button-edit-recipe">
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>

              {(() => {
                let parsedIngredients: Ingredient[] | null = null;
                let parsedSteps: string[] | null = null;
                try {
                  if (selectedMeal.ingredients) parsedIngredients = JSON.parse(selectedMeal.ingredients);
                  if (selectedMeal.steps) parsedSteps = JSON.parse(selectedMeal.steps);
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
            </>
          )}

          {(dialogMode === "create" || dialogMode === "edit") && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-form-title">
                  {dialogMode === "edit" ? "Edit Recipe" : "New Recipe"}
                </DialogTitle>
                <DialogDescription>
                  {dialogMode === "edit" ? "Update the recipe details" : "Add a new recipe to your collection"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Recipe name" data-testid="input-recipe-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Prep Time</label>
                    <Input value={formPrepTime} onChange={(e) => setFormPrepTime(e.target.value)} placeholder="e.g. 15 min" data-testid="input-prep-time" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Cook Time</label>
                    <Input value={formCookTime} onChange={(e) => setFormCookTime(e.target.value)} placeholder="e.g. 30 min" data-testid="input-cook-time" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Calories</label>
                    <Input type="number" value={formCalories} onChange={(e) => setFormCalories(e.target.value)} placeholder="e.g. 450" data-testid="input-calories" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Difficulty</label>
                    <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Icon</label>
                    <Select value={formIcon} onValueChange={setFormIcon}>
                      <SelectTrigger data-testid="select-icon">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => {
                          const IC = getMealIcon(icon);
                          return (
                            <SelectItem key={icon} value={icon}>
                              <span className="flex items-center gap-2"><IC className="w-4 h-4" /> {icon}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Tags</label>
                    <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="e.g. Italian, Pasta" data-testid="input-tags" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Ingredients (one per line, format: amount - item)</label>
                  <Textarea
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    placeholder={"2 cups - flour\n1 tsp - salt\n3 tbsp - olive oil"}
                    rows={4}
                    data-testid="input-ingredients"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Steps (one per line)</label>
                  <Textarea
                    value={formSteps}
                    onChange={(e) => setFormSteps(e.target.value)}
                    placeholder={"Preheat oven to 375F\nMix dry ingredients\nAdd wet ingredients and stir"}
                    rows={4}
                    data-testid="input-steps"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={!formName.trim() || !formCalories || isSaving}
                  data-testid="button-save-recipe"
                >
                  {isSaving ? "Saving..." : dialogMode === "edit" ? "Save Changes" : "Add Recipe"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
