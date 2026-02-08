import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Timer, Flame, ChevronRight, ChevronDown, Loader2,
  UtensilsCrossed, Users, Trash2, ChefHat, ShoppingBasket, Plus
} from "lucide-react";
import type { AiMealPlan } from "@shared/schema";

interface Ingredient {
  item: string;
  amount: string;
}

const cuisineOptions = [
  "Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai",
  "Mediterranean", "American", "Korean", "French", "Greek", "Middle Eastern",
  "Vietnamese", "Brazilian", "Ethiopian",
];

const portionOptions = ["1", "2", "3", "4", "5", "6"];

const calorieRangeOptions = [
  "200-400 cal",
  "400-600 cal",
  "600-800 cal",
  "800-1000 cal",
  "1000-1200 cal",
];

const dietaryRestrictionOptions = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Keto",
  "Paleo",
  "Low-Sodium",
  "Halal",
  "Kosher",
];

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (d === "Hard") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
};

export function AiMealGenerator() {
  const [formExpanded, setFormExpanded] = useState(false);
  const [cuisine, setCuisine] = useState("");
  const [portions, setPortions] = useState("2");
  const [calorieRange, setCalorieRange] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<{
    recipeName: string;
    prepTime: string;
    cookTime: string;
    totalCalories: number;
    caloriesPerServing: number;
    difficulty: string;
    ingredients: Ingredient[];
    steps: string[];
    aiRecipeId?: string;
  } | null>(null);
  const [recipeExpanded, setRecipeExpanded] = useState(true);

  const { toast } = useToast();

  const { data: pastRecipes = [] } = useQuery<AiMealPlan[]>({
    queryKey: ["/api/ai-meal-plans"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { cuisine: string; portions: number; calorieRange: string; dietaryRestrictions: string[] }) => {
      const res = await apiRequest("POST", "/api/ai-meal-plans/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedRecipe({
        recipeName: data.recipeName,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        totalCalories: data.totalCalories,
        caloriesPerServing: data.caloriesPerServing,
        difficulty: data.difficulty,
        ingredients: data.ingredients,
        steps: data.steps,
        aiRecipeId: data.id,
      });
      setRecipeExpanded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-meal-plans"] });
      toast({ title: "Recipe generated!" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to generate recipe", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ai-meal-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-meal-plans"] });
      toast({ title: "Recipe deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete recipe", variant: "destructive" });
    },
  });

  const addToMealsMutation = useMutation({
    mutationFn: async (data: {
      name: string; prepTime: string; calories: number; difficulty: string; tags: string[];
      cookTime?: string; ingredients?: string; steps?: string; aiRecipeId?: string;
    }) => {
      await apiRequest("POST", "/api/meals", {
        name: data.name,
        prepTime: data.prepTime,
        calories: data.calories,
        difficulty: data.difficulty,
        tags: data.tags,
        iconName: "ChefHat",
        cookTime: data.cookTime,
        ingredients: data.ingredients,
        steps: data.steps,
      });
      if (data.aiRecipeId) {
        await apiRequest("DELETE", `/api/ai-meal-plans/${data.aiRecipeId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-meal-plans"] });
      toast({ title: "Recipe added to your meal collection!" });
    },
    onError: () => {
      toast({ title: "Failed to add recipe", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!cuisine || !calorieRange) return;
    generateMutation.mutate({
      cuisine,
      portions: parseInt(portions),
      calorieRange,
      dietaryRestrictions: selectedRestrictions,
    });
  };

  const toggleRestriction = (r: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const viewPastRecipe = (plan: AiMealPlan) => {
    try {
      const ingredients = JSON.parse(plan.ingredients) as Ingredient[];
      const steps = JSON.parse(plan.steps) as string[];
      setGeneratedRecipe({
        recipeName: plan.recipeName,
        prepTime: plan.prepTime,
        cookTime: plan.cookTime,
        totalCalories: plan.totalCalories,
        caloriesPerServing: plan.caloriesPerServing,
        difficulty: plan.difficulty,
        ingredients,
        steps,
        aiRecipeId: plan.id,
      });
      setRecipeExpanded(true);
    } catch {
      toast({ title: "Could not load recipe", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-ai-meal-title">AI Recipe Generator</h2>
          <p className="text-sm text-muted-foreground">Custom recipes tailored to your preferences</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div
            className="flex items-center justify-between gap-3 p-4 cursor-pointer flex-wrap"
            onClick={() => setFormExpanded(!formExpanded)}
            data-testid="button-toggle-recipe-form"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-sm text-foreground">Configure Recipe</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${formExpanded ? "rotate-180" : ""}`} />
          </div>

          {formExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Cuisine Type</label>
                  <Select value={cuisine} onValueChange={setCuisine}>
                    <SelectTrigger data-testid="select-meal-cuisine">
                      <SelectValue placeholder="Choose cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineOptions.map((c) => (
                        <SelectItem key={c} value={c} data-testid={`option-cuisine-${c.toLowerCase().replace(/\s+/g, "-")}`}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Portions</label>
                  <Select value={portions} onValueChange={setPortions}>
                    <SelectTrigger data-testid="select-meal-portions">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {portionOptions.map((p) => (
                        <SelectItem key={p} value={p} data-testid={`option-portions-${p}`}>{p} {parseInt(p) === 1 ? "serving" : "servings"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Calorie Range (per serving)</label>
                <Select value={calorieRange} onValueChange={setCalorieRange}>
                  <SelectTrigger data-testid="select-meal-calories">
                    <SelectValue placeholder="Select calorie range" />
                  </SelectTrigger>
                  <SelectContent>
                    {calorieRangeOptions.map((c) => (
                      <SelectItem key={c} value={c} data-testid={`option-calrange-${c.split(" ")[0]}`}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Dietary Restrictions</label>
                <div className="flex gap-2 flex-wrap">
                  {dietaryRestrictionOptions.map((r) => (
                    <Badge
                      key={r}
                      variant={selectedRestrictions.includes(r) ? "default" : "outline"}
                      className={`cursor-pointer toggle-elevate ${selectedRestrictions.includes(r) ? "toggle-elevated" : ""}`}
                      onClick={() => toggleRestriction(r)}
                      data-testid={`badge-restriction-${r.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0"
                onClick={handleGenerate}
                disabled={!cuisine || !calorieRange || generateMutation.isPending}
                data-testid="button-generate-meal"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating recipe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Recipe
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedRecipe && (
        <Card data-testid="card-generated-recipe">
          <CardContent className="p-0">
            <div
              className="flex items-center justify-between gap-3 p-4 cursor-pointer flex-wrap"
              onClick={() => setRecipeExpanded(!recipeExpanded)}
              data-testid="button-toggle-recipe"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground" data-testid="text-recipe-name">{generatedRecipe.recipeName}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className={difficultyColor(generatedRecipe.difficulty)}>
                    {generatedRecipe.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" /> Prep: {generatedRecipe.prepTime}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><ChefHat className="w-3 h-3" /> Cook: {generatedRecipe.cookTime}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> {generatedRecipe.caloriesPerServing} cal/serving</span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${recipeExpanded ? "rotate-90" : ""}`} />
            </div>

            {recipeExpanded && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <ShoppingBasket className="w-4 h-4 text-emerald-500" />
                    Ingredients
                  </h4>
                  <div className="space-y-1.5">
                    {generatedRecipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 bg-muted/40 rounded-md text-sm"
                        data-testid={`ingredient-${i}`}
                      >
                        <span className="font-medium text-foreground min-w-[80px]">{ing.amount}</span>
                        <span className="text-muted-foreground">{ing.item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                    Instructions
                  </h4>
                  <div className="space-y-2">
                    {generatedRecipe.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 bg-muted/40 rounded-md"
                        data-testid={`step-${i}`}
                      >
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {portions} servings</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {generatedRecipe.totalCalories} cal total</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {generatedRecipe.caloriesPerServing} cal/serving</span>
                </div>

                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => {
                    addToMealsMutation.mutate({
                      name: generatedRecipe.recipeName,
                      prepTime: generatedRecipe.prepTime,
                      calories: generatedRecipe.caloriesPerServing,
                      difficulty: generatedRecipe.difficulty,
                      tags: [cuisine, ...(selectedRestrictions.length > 0 ? selectedRestrictions.slice(0, 2) : [])],
                      cookTime: generatedRecipe.cookTime,
                      ingredients: JSON.stringify(generatedRecipe.ingredients),
                      steps: JSON.stringify(generatedRecipe.steps),
                      aiRecipeId: generatedRecipe.aiRecipeId,
                    });
                    setGeneratedRecipe(null);
                  }}
                  disabled={addToMealsMutation.isPending}
                  data-testid="button-add-to-meals"
                >
                  {addToMealsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Meals
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {pastRecipes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Recipes</h3>
          <div className="grid sm:grid-cols-2 gap-3 min-w-0">
            {pastRecipes.slice(0, 6).map((recipe) => (
              <Card
                key={recipe.id}
                className="hover-elevate cursor-pointer min-w-0"
                onClick={() => viewPastRecipe(recipe)}
                data-testid={`card-past-recipe-${recipe.id}`}
              >
                <CardContent className="p-4 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-foreground truncate">{recipe.recipeName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <Badge variant="secondary">{recipe.cuisine}</Badge>
                        <span>{recipe.caloriesPerServing} cal/serving</span>
                        <span>{recipe.portions} servings</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-add-past-recipe-${recipe.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToMealsMutation.mutate({
                            name: recipe.recipeName,
                            prepTime: recipe.prepTime,
                            calories: recipe.caloriesPerServing,
                            difficulty: recipe.difficulty,
                            tags: [recipe.cuisine, ...(recipe.dietaryRestrictions || []).slice(0, 2)],
                            cookTime: recipe.cookTime,
                            ingredients: recipe.ingredients,
                            steps: recipe.steps,
                            aiRecipeId: recipe.id,
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-recipe-${recipe.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(recipe.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
