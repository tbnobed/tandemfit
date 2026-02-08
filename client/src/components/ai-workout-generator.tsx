import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Dumbbell, Timer, Flame, Target, ChevronRight,
  RotateCcw, User, Ruler, Weight, Calendar, Loader2,
  ArrowRight, Settings2, Trash2, Plus
} from "lucide-react";
import type { Partner, AiWorkoutPlan } from "@shared/schema";

function formatHeight(feet: number, inches: number): string {
  return `${feet}'${inches}"`;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  formTip: string;
  muscleGroup: string;
}

interface AiWorkoutGeneratorProps {
  partners: Partner[];
}

const focusAreas = [
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Core & Abs",
  "Cardio & Endurance",
  "Flexibility & Mobility",
  "HIIT",
  "Strength Training",
];

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (d === "Hard") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
};

export function AiWorkoutGenerator({ partners }: AiWorkoutGeneratorProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<string>("");
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [planExpanded, setPlanExpanded] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState<{
    planName: string;
    exercises: Exercise[];
    totalDuration: string;
    totalCalories: number;
    difficulty: string;
    focusArea: string;
  } | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    age: "",
    heightFeet: "",
    heightInches: "",
    weightLbs: "",
    fitnessLevel: "intermediate",
    goal: "general fitness",
  });

  const { toast } = useToast();

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  const { data: pastPlans = [] } = useQuery<AiWorkoutPlan[]>({
    queryKey: ["/api/ai-workout-plans", selectedPartnerId],
    enabled: !!selectedPartnerId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { partnerId: string; focusArea: string }) => {
      const res = await apiRequest("POST", "/api/ai-workout-plans/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan({
        planName: data.planName,
        exercises: data.exercises,
        totalDuration: data.totalDuration,
        totalCalories: data.totalCalories,
        difficulty: data.difficulty,
        focusArea: data.focusArea,
      });
      setExpandedExercise(null);
      setPlanExpanded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-workout-plans", selectedPartnerId] });
      toast({ title: "Workout plan generated!" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to generate plan", description: e.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { id: string; body: Record<string, any> }) => {
      await apiRequest("PATCH", `/api/partners/${data.id}`, data.body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setShowProfileDialog(false);
      toast({ title: "Profile updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!selectedPartnerId || !selectedFocus) return;
    generateMutation.mutate({ partnerId: selectedPartnerId, focusArea: selectedFocus });
  };

  const handleOpenProfile = () => {
    if (selectedPartner) {
      setProfileForm({
        age: selectedPartner.age?.toString() || "",
        heightFeet: selectedPartner.heightFeet?.toString() || "",
        heightInches: selectedPartner.heightInches?.toString() || "",
        weightLbs: selectedPartner.weightLbs?.toString() || "",
        fitnessLevel: selectedPartner.fitnessLevel || "intermediate",
        goal: selectedPartner.goal || "general fitness",
      });
      setShowProfileDialog(true);
    }
  };

  const handleSaveProfile = () => {
    if (!selectedPartnerId) return;
    updateProfileMutation.mutate({
      id: selectedPartnerId,
      body: {
        age: profileForm.age ? parseInt(profileForm.age) : null,
        heightFeet: profileForm.heightFeet ? parseInt(profileForm.heightFeet) : null,
        heightInches: profileForm.heightInches ? parseInt(profileForm.heightInches) : null,
        weightLbs: profileForm.weightLbs ? parseInt(profileForm.weightLbs) : null,
        fitnessLevel: profileForm.fitnessLevel,
        goal: profileForm.goal,
      },
    });
  };

  const viewPastPlan = (plan: AiWorkoutPlan) => {
    try {
      const exercises = JSON.parse(plan.exercises) as Exercise[];
      setGeneratedPlan({
        planName: plan.planName,
        exercises,
        totalDuration: plan.totalDuration,
        totalCalories: plan.totalCalories,
        difficulty: plan.difficulty,
        focusArea: plan.focusArea,
      });
      setPlanExpanded(true);
      setExpandedExercise(null);
    } catch {
      toast({ title: "Could not load plan", variant: "destructive" });
    }
  };

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ai-workout-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-workout-plans", selectedPartnerId] });
      toast({ title: "Plan deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete plan", variant: "destructive" });
    },
  });

  const addToActivitiesMutation = useMutation({
    mutationFn: async (plan: { planName: string; exercises: Exercise[]; totalDuration: string; totalCalories: number; difficulty: string; focusArea: string }) => {
      await apiRequest("POST", "/api/activities", {
        name: plan.planName,
        type: plan.focusArea,
        duration: plan.totalDuration,
        calories: plan.totalCalories,
        difficulty: plan.difficulty,
        iconName: "Dumbbell",
        exercises: JSON.stringify(plan.exercises),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Added to activities!" });
    },
    onError: () => {
      toast({ title: "Failed to add activity", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-ai-workout-title">AI Workout Generator</h2>
          <p className="text-sm text-muted-foreground">Personalized plans based on your metabolic profile</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Generate for</label>
              <Select value={selectedPartnerId} onValueChange={(val) => { setSelectedPartnerId(val); setGeneratedPlan(null); }}>
                <SelectTrigger data-testid="select-ai-partner">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id} data-testid={`option-ai-partner-${p.name.toLowerCase()}`}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Focus area</label>
              <Select value={selectedFocus} onValueChange={setSelectedFocus}>
                <SelectTrigger data-testid="select-ai-focus">
                  <SelectValue placeholder="Choose focus" />
                </SelectTrigger>
                <SelectContent>
                  {focusAreas.map((f) => (
                    <SelectItem key={f} value={f} data-testid={`option-focus-${f.toLowerCase().replace(/\s+/g, "-")}`}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPartner && (
            <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md flex-wrap">
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {selectedPartner.age && (
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedPartner.age} yrs</span>
                )}
                {selectedPartner.heightFeet && (
                  <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {formatHeight(selectedPartner.heightFeet, selectedPartner.heightInches || 0)}</span>
                )}
                {selectedPartner.weightLbs && (
                  <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> {selectedPartner.weightLbs} lbs</span>
                )}
                {selectedPartner.fitnessLevel && (
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {selectedPartner.fitnessLevel}</span>
                )}
                {selectedPartner.goal && (
                  <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> {selectedPartner.goal}</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleOpenProfile} data-testid="button-edit-profile">
                <Settings2 className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            onClick={handleGenerate}
            disabled={!selectedPartnerId || !selectedFocus || generateMutation.isPending}
            data-testid="button-generate-workout"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating your plan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Workout Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPlan && (
        <Card data-testid="card-generated-plan">
          <CardContent className="p-0">
            <div
              className="flex items-center justify-between gap-3 p-4 cursor-pointer flex-wrap"
              onClick={() => setPlanExpanded(!planExpanded)}
              data-testid="button-toggle-plan"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate" data-testid="text-plan-name">{generatedPlan.planName}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className={difficultyColor(generatedPlan.difficulty)}>
                    {generatedPlan.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" /> {generatedPlan.totalDuration}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> ~{generatedPlan.totalCalories} cal</span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${planExpanded ? "rotate-90" : ""}`} />
            </div>

            {planExpanded && (
              <div className="px-4 pb-4 space-y-3">
                <div className="space-y-2">
                  {generatedPlan.exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-muted/40 rounded-md cursor-pointer hover-elevate"
                      data-testid={`exercise-item-${i}`}
                      onClick={() => setExpandedExercise(expandedExercise === i ? null : i)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate">{ex.name}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{ex.sets}x{ex.reps}</span>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expandedExercise === i ? "rotate-90" : ""}`} />
                      </div>
                      {expandedExercise === i && (
                        <div className="px-3 pb-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-background rounded-md">
                              <div className="font-semibold text-foreground">{ex.sets} sets</div>
                              <div className="text-muted-foreground">{ex.reps}</div>
                            </div>
                            <div className="text-center p-2 bg-background rounded-md">
                              <div className="font-semibold text-foreground">{ex.restSeconds}s</div>
                              <div className="text-muted-foreground">Rest</div>
                            </div>
                            <div className="text-center p-2 bg-background rounded-md">
                              <div className="font-semibold text-foreground">{ex.muscleGroup}</div>
                              <div className="text-muted-foreground">Muscle</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 bg-background rounded-md text-xs">
                            <Target className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-muted-foreground">{ex.formTip}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => addToActivitiesMutation.mutate(generatedPlan!)}
                    disabled={addToActivitiesMutation.isPending}
                    data-testid="button-add-to-activities"
                  >
                    {addToActivitiesMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Activities
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    data-testid="button-regenerate"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedPartnerId && pastPlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Plans</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {pastPlans.slice(0, 4).map((plan) => (
              <Card
                key={plan.id}
                className="hover-elevate cursor-pointer"
                onClick={() => viewPastPlan(plan)}
                data-testid={`card-past-plan-${plan.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-foreground truncate">{plan.planName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <Badge variant="secondary">{plan.focusArea}</Badge>
                        <span>{plan.totalDuration}</span>
                        <span>~{plan.totalCalories} cal</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-add-past-plan-${plan.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        let exercises: Exercise[] = [];
                        try { exercises = JSON.parse(plan.exercises) as Exercise[]; } catch {}
                        addToActivitiesMutation.mutate({
                          planName: plan.planName,
                          exercises,
                          totalDuration: plan.totalDuration,
                          totalCalories: plan.totalCalories,
                          difficulty: plan.difficulty,
                          focusArea: plan.focusArea,
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-delete-plan-${plan.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlanMutation.mutate(plan.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Metabolic Profile</DialogTitle>
            <DialogDescription>
              Update {selectedPartner?.name}'s information for more accurate workout plans
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Age</label>
                <Input
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  placeholder="28"
                  data-testid="input-profile-age"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Weight (lbs)</label>
                <Input
                  type="number"
                  value={profileForm.weightLbs}
                  onChange={(e) => setProfileForm({ ...profileForm, weightLbs: e.target.value })}
                  placeholder="180"
                  data-testid="input-profile-weight"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Height</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    value={profileForm.heightFeet}
                    onChange={(e) => setProfileForm({ ...profileForm, heightFeet: e.target.value })}
                    placeholder="5"
                    data-testid="input-profile-height-feet"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ft</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={profileForm.heightInches}
                    onChange={(e) => setProfileForm({ ...profileForm, heightInches: e.target.value })}
                    placeholder="10"
                    data-testid="input-profile-height-inches"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">in</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Fitness Level</label>
              <Select value={profileForm.fitnessLevel} onValueChange={(val) => setProfileForm({ ...profileForm, fitnessLevel: val })}>
                <SelectTrigger data-testid="select-profile-fitness">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Fitness Goal</label>
              <Select value={profileForm.goal} onValueChange={(val) => setProfileForm({ ...profileForm, goal: val })}>
                <SelectTrigger data-testid="select-profile-goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general fitness">General Fitness</SelectItem>
                  <SelectItem value="muscle building">Muscle Building</SelectItem>
                  <SelectItem value="weight loss">Weight Loss</SelectItem>
                  <SelectItem value="toning and cardio">Toning & Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
