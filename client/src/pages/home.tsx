import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
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

  const planMealMutation = useMutation({
    mutationFn: async (data: { mealId: string; dayOfWeek: number }) => {
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
      <Header partners={partners} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "dashboard" && (
          <DashboardTab
            partners={partners}
            challenges={challenges}
            messages={messages}
            workoutLogs={workoutLogs}
            onSendMessage={(msg) => sendMessageMutation.mutate(msg)}
            isSending={sendMessageMutation.isPending}
          />
        )}
        {activeTab === "activities" && (
          <ActivitiesTab
            activities={activities}
            partners={partners}
            onLogWorkout={(data) => logWorkoutMutation.mutate(data)}
            isLogging={logWorkoutMutation.isPending}
            onCreateActivity={(data) => createActivityMutation.mutate(data)}
            onUpdateActivity={(id, data) => updateActivityMutation.mutate({ id, data })}
            onDeleteActivity={(id) => deleteActivityMutation.mutate(id)}
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
            isPlanning={planMealMutation.isPending}
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
