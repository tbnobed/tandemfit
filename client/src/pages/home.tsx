import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { SplashScreen } from "@/components/splash-screen";
import { TabNavigation, type TabId } from "@/components/tab-navigation";
import { DashboardTab } from "@/components/dashboard-tab";
import { ActivitiesTab } from "@/components/activities-tab";
import { MealsTab } from "@/components/meals-tab";
import { ChallengesTab } from "@/components/challenges-tab";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Partner,
  Activity,
  Meal,
  MealPlan,
  Challenge,
  Badge,
  MotivationMessage,
  WorkoutLog,
  AiWorkoutPlan,
} from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [activePartnerId, setActivePartnerId] = useState<string | null>(() => {
    return localStorage.getItem("tandemfit_active_partner");
  });
  const { toast } = useToast();

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: mealPlans = [], isLoading: mealPlansLoading } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans"],
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MotivationMessage[]>({
    queryKey: ["/api/messages"],
  });

  const { data: workoutLogs = [], isLoading: logsLoading } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workout-logs"],
  });

  useEffect(() => {
    if (partners.length > 0 && activePartnerId) {
      if (!partners.find(p => p.id === activePartnerId)) {
        setActivePartnerId(null);
        localStorage.removeItem("tandemfit_active_partner");
      }
    }
  }, [partners, activePartnerId]);

  const handleSelectPartner = (id: string) => {
    setActivePartnerId(id);
    localStorage.setItem("tandemfit_active_partner", id);
  };

  const activePartner = partners.find(p => p.id === activePartnerId) || null;

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      await apiRequest("POST", "/api/messages", { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const logWorkoutMutation = useMutation({
    mutationFn: async (data: {
      partnerId: string;
      activityName: string;
      duration: number;
      caloriesBurned: number;
    }) => {
      await apiRequest("POST", "/api/workout-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Workout logged!" });
    },
    onError: () => {
      toast({ title: "Failed to log workout", variant: "destructive" });
    },
  });

  const updateWorkoutLogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { activityName?: string; duration?: number; caloriesBurned?: number } }) => {
      await apiRequest("PATCH", `/api/workout-logs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      toast({ title: "Workout updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update workout", variant: "destructive" });
    },
  });

  const deleteWorkoutLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workout-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Workout deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete workout", variant: "destructive" });
    },
  });

  const planMealMutation = useMutation({
    mutationFn: async (data: { mealId: string; dayOfWeek: number; mealType: string }) => {
      await apiRequest("POST", "/api/meal-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Meal planned!" });
    },
    onError: () => {
      toast({ title: "Failed to plan meal", variant: "destructive" });
    },
  });

  const toggleMealCompleteMutation = useMutation({
    mutationFn: async ({ planId, completed }: { planId: string; completed: boolean }) => {
      await apiRequest("PATCH", `/api/meal-plans/${planId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
    },
  });

  const createMealMutation = useMutation({
    mutationFn: async (data: { name: string; prepTime: string; calories: number; tags: string[]; difficulty: string; iconName: string; cookTime?: string; ingredients?: string; steps?: string }) => {
      await apiRequest("POST", "/api/meals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Recipe added!" });
    },
    onError: () => {
      toast({ title: "Failed to create recipe", variant: "destructive" });
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; prepTime: string; calories: number; tags: string[]; difficulty: string; iconName: string; cookTime?: string; ingredients?: string; steps?: string }> }) => {
      await apiRequest("PATCH", `/api/meals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Recipe updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update recipe", variant: "destructive" });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Recipe removed" });
    },
    onError: () => {
      toast({ title: "Failed to delete recipe", variant: "destructive" });
    },
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meal-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Day cleared" });
    },
    onError: () => {
      toast({ title: "Failed to clear day", variant: "destructive" });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; duration: string; calories: number; difficulty: string; iconName: string }) => {
      await apiRequest("POST", "/api/activities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity created!" });
    },
    onError: () => {
      toast({ title: "Failed to create activity", variant: "destructive" });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; type: string; duration: string; calories: number; difficulty: string; iconName: string }> }) => {
      await apiRequest("PATCH", `/api/activities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update activity", variant: "destructive" });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete activity", variant: "destructive" });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      await apiRequest("PATCH", `/api/challenges/${id}`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      toast({ title: "Challenge progress updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update progress", variant: "destructive" });
    },
  });

  const updateGoalsMutation = useMutation({
    mutationFn: async ({ partnerId, weeklyGoal, calorieGoal }: { partnerId: string; weeklyGoal: number; calorieGoal: number }) => {
      await apiRequest("PATCH", `/api/partners/${partnerId}`, { weeklyGoal, calorieGoal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Goals updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update goals", variant: "destructive" });
    },
  });

  const showSplash = !partnersLoading && partners.length > 0 && !activePartnerId;

  if (showSplash) {
    return <SplashScreen partners={partners} onSelectPartner={handleSelectPartner} />;
  }

  const isLoading = partnersLoading || activitiesLoading || mealsLoading || challengesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-[hsl(320,85%,45%)] via-[hsl(340,80%,50%)] to-[hsl(25,90%,55%)] text-white">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-md bg-white/20" />
              <Skeleton className="w-40 h-8 rounded bg-white/20" />
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Skeleton className="h-32 rounded-md" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-44 rounded-md" />
            <Skeleton className="h-44 rounded-md" />
          </div>
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header partners={partners} activePartnerId={activePartnerId} onSelectPartner={handleSelectPartner} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "dashboard" && (
          <DashboardTab
            partners={partners}
            activePartner={activePartner}
            challenges={challenges}
            messages={messages}
            workoutLogs={workoutLogs}
            onSendMessage={(msg) => sendMessageMutation.mutate(msg)}
            onUpdateGoals={(partnerId, weeklyGoal, calorieGoal) => updateGoalsMutation.mutate({ partnerId, weeklyGoal, calorieGoal })}
            isSending={sendMessageMutation.isPending}
            isUpdatingGoals={updateGoalsMutation.isPending}
          />
        )}
        {activeTab === "activities" && (
          <ActivitiesTab
            activities={activities}
            partners={partners}
            activePartner={activePartner}
            workoutLogs={workoutLogs}
            onLogWorkout={(data) => logWorkoutMutation.mutate(data)}
            isLogging={logWorkoutMutation.isPending}
            onCreateActivity={(data) => createActivityMutation.mutate(data)}
            onUpdateActivity={(id, data) => updateActivityMutation.mutate({ id, data })}
            onDeleteActivity={(id) => deleteActivityMutation.mutate(id)}
            onUpdateWorkoutLog={(id, data) => updateWorkoutLogMutation.mutate({ id, data })}
            onDeleteWorkoutLog={(id) => deleteWorkoutLogMutation.mutate(id)}
            isSaving={createActivityMutation.isPending || updateActivityMutation.isPending}
          />
        )}
        {activeTab === "meals" && (
          <MealsTab
            meals={meals}
            mealPlans={mealPlans}
            onPlanMeal={(data) => planMealMutation.mutate(data)}
            onToggleMealComplete={(planId, completed) =>
              toggleMealCompleteMutation.mutate({ planId, completed })
            }
            onCreateMeal={(data) => createMealMutation.mutate(data)}
            onUpdateMeal={(id, data) => updateMealMutation.mutate({ id, data })}
            onDeleteMeal={(id) => deleteMealMutation.mutate(id)}
            onDeleteMealPlan={(id) => deleteMealPlanMutation.mutate(id)}
            isPlanning={planMealMutation.isPending}
            isSaving={createMealMutation.isPending || updateMealMutation.isPending}
          />
        )}
        {activeTab === "challenges" && (
          <ChallengesTab
            challenges={challenges}
            badges={badges}
            onUpdateProgress={(id, progress) =>
              updateProgressMutation.mutate({ id, progress })
            }
            isUpdating={updateProgressMutation.isPending}
          />
        )}
      </main>
    </div>
  );
}
