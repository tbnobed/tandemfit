import {
  Dumbbell, Mountain, Waves, Bike, Zap, Music, Timer, Flame as FireIcon, BarChart3,
  HeartPulse, Footprints, PersonStanding, Pencil, Trash2, Plus, ChevronDown, Clock,
  Play, User, Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Activity, Partner, WorkoutLog } from "@shared/schema";
import { AiWorkoutGenerator } from "./ai-workout-generator";

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  formTip: string;
  muscleGroup: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mountain, Waves, PersonStanding, Bike, Zap, Music, Dumbbell,
  HeartPulse, Footprints, Timer, BarChart3,
};

const iconOptions = ["Dumbbell", "Mountain", "Waves", "Bike", "Zap", "Music", "HeartPulse", "Footprints", "Timer", "BarChart3", "PersonStanding"];

function getIcon(name: string) {
  return iconMap[name] || Dumbbell;
}

const MET_VALUES: Record<string, number> = {
  "Free Weights": 6.0,
  "Cardio": 7.0,
  "HIIT": 8.0,
  "Yoga": 3.0,
  "Walking": 3.5,
  "Running": 9.8,
  "Cycling": 7.5,
  "Swimming": 8.0,
  "Dance": 5.5,
  "Stretching": 2.5,
  "Bodyweight": 5.0,
  "Core": 4.0,
  "Pilates": 3.5,
  "CrossFit": 8.0,
  "Boxing": 7.8,
  "Climbing": 8.0,
  "Other": 5.0,
};

const WORKOUT_TYPES = Object.keys(MET_VALUES);

function calculateCalories(
  partner: Partner,
  workoutType: string,
  durationMinutes: number
): number {
  const weightKg = (partner.weightLbs || 150) * 0.453592;
  const met = MET_VALUES[workoutType] || MET_VALUES["Other"];
  const calories = met * weightKg * (durationMinutes / 60);
  return Math.round(calories);
}

function parseDurationMinutes(duration: string): number {
  const num = parseInt(duration.replace(/[^\d]/g, ""));
  return isNaN(num) || num <= 0 ? 30 : num;
}

function guessWorkoutType(activityName: string): string {
  const lower = activityName.toLowerCase();
  if (lower.includes("run") || lower.includes("jog")) return "Running";
  if (lower.includes("walk")) return "Walking";
  if (lower.includes("swim")) return "Swimming";
  if (lower.includes("cycl") || lower.includes("bike")) return "Cycling";
  if (lower.includes("yoga")) return "Yoga";
  if (lower.includes("hiit") || lower.includes("circuit")) return "HIIT";
  if (lower.includes("dance") || lower.includes("zumba")) return "Dance";
  if (lower.includes("stretch") || lower.includes("flex")) return "Stretching";
  if (lower.includes("core") || lower.includes("abs")) return "Core";
  if (lower.includes("pilates")) return "Pilates";
  if (lower.includes("crossfit")) return "CrossFit";
  if (lower.includes("box")) return "Boxing";
  if (lower.includes("climb")) return "Climbing";
  if (lower.includes("weight") || lower.includes("dumbbell") || lower.includes("bench") || lower.includes("curl") || lower.includes("press") || lower.includes("row") || lower.includes("squat")) return "Free Weights";
  if (lower.includes("cardio")) return "Cardio";
  if (lower.includes("body") || lower.includes("pushup") || lower.includes("push-up") || lower.includes("plank")) return "Bodyweight";
  return "Other";
}

interface ActivitiesTabProps {
  activities: Activity[];
  partners: Partner[];
  activePartner: Partner | null;
  workoutLogs: WorkoutLog[];
  onLogWorkout: (data: {
    partnerId: string;
    activityName: string;
    duration: number;
    caloriesBurned: number;
  }) => void;
  isLogging: boolean;
  onCreateActivity: (data: { name: string; type: string; duration: string; calories: number; difficulty: string; iconName: string }) => void;
  onUpdateActivity: (id: string, data: Partial<{ name: string; type: string; duration: string; calories: number; difficulty: string; iconName: string }>) => void;
  onDeleteActivity: (id: string) => void;
  isSaving: boolean;
}

interface ActivityFormState {
  name: string;
  type: string;
  duration: string;
  calories: string;
  difficulty: string;
  iconName: string;
}

const defaultForm: ActivityFormState = {
  name: "",
  type: "Together",
  duration: "30 min",
  calories: "200",
  difficulty: "Medium",
  iconName: "Dumbbell",
};

function parseExercises(activity: Activity): WorkoutExercise[] | null {
  if (!activity.exercises) return null;
  try {
    const parsed = JSON.parse(activity.exercises);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return null;
}

export function ActivitiesTab({ activities, partners, activePartner, workoutLogs, onLogWorkout, isLogging, onCreateActivity, onUpdateActivity, onDeleteActivity, isSaving }: ActivitiesTabProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ActivityFormState>(defaultForm);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordType, setRecordType] = useState<string>("Free Weights");
  const [recordDuration, setRecordDuration] = useState<string>("60");
  const [recordName, setRecordName] = useState<string>("");

  const visibleActivities = activities.filter((a) => {
    if (a.type === "Individual" && a.partnerId && activePartner) {
      return a.partnerId === activePartner.id;
    }
    if (a.type === "Individual" && a.partnerId && !activePartner) {
      return false;
    }
    return true;
  });

  const filtered = filter === "all"
    ? visibleActivities
    : visibleActivities.filter((a) => a.type === filter);

  const handleLog = () => {
    if (!selectedActivity || !activePartner) return;
    const duration = parseDurationMinutes(selectedActivity.duration);
    const wType = guessWorkoutType(selectedActivity.name);
    const cal = calculateCalories(activePartner, wType, duration);
    onLogWorkout({
      partnerId: activePartner.id,
      activityName: selectedActivity.name,
      duration,
      caloriesBurned: cal,
    });
    setSelectedActivity(null);
  };

  const handleRecordWorkout = () => {
    if (!activePartner) return;
    const dur = parseInt(recordDuration);
    if (isNaN(dur) || dur <= 0) return;
    const cal = calculateCalories(activePartner, recordType, dur);
    const name = recordName.trim() || `${recordType} Session`;
    onLogWorkout({
      partnerId: activePartner.id,
      activityName: name,
      duration: dur,
      caloriesBurned: cal,
    });
    setRecordOpen(false);
    setRecordName("");
    setRecordDuration("60");
    setRecordType("Free Weights");
  };

  const openEdit = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingActivity(activity);
    setForm({
      name: activity.name,
      type: activity.type,
      duration: activity.duration,
      calories: String(activity.calories),
      difficulty: activity.difficulty,
      iconName: activity.iconName,
    });
  };

  const openCreate = () => {
    setIsCreating(true);
    setForm(defaultForm);
  };

  const handleSave = () => {
    const cal = parseInt(form.calories);
    if (!form.name.trim() || !form.duration.trim() || isNaN(cal) || cal <= 0) return;

    if (editingActivity) {
      onUpdateActivity(editingActivity.id, {
        name: form.name.trim(),
        type: form.type,
        duration: form.duration.trim(),
        calories: cal,
        difficulty: form.difficulty,
        iconName: form.iconName,
      });
      setEditingActivity(null);
    } else {
      onCreateActivity({
        name: form.name.trim(),
        type: form.type,
        duration: form.duration.trim(),
        calories: cal,
        difficulty: form.difficulty,
        iconName: form.iconName,
      });
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteActivity(id);
  };

  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (d === "Hard") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  };

  const formDialog = editingActivity || isCreating;

  const myLogs = activePartner
    ? workoutLogs.filter(l => l.partnerId === activePartner.id).sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    : [];

  const thisWeekLogs = myLogs.filter(l => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return new Date(l.loggedAt) >= startOfWeek;
  });

  const weekCalories = thisWeekLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);
  const weekMinutes = thisWeekLogs.reduce((sum, l) => sum + l.duration, 0);
  const weekWorkouts = thisWeekLogs.length;

  const estimatedCalories = activePartner
    ? calculateCalories(activePartner, recordType, parseInt(recordDuration) || 0)
    : 0;

  return (
    <div className="space-y-8">
      {activePartner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                activePartner.color === "blue" ? "bg-blue-500" : "bg-pink-500"
              }`}>
                {activePartner.name[0]}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-my-workouts-title">
                  {activePartner.name}'s Workouts
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activePartner.weightLbs} lbs, {activePartner.heightFeet}'{activePartner.heightInches}" &middot; {activePartner.fitnessLevel}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setRecordOpen(true)}
              data-testid="button-record-workout"
            >
              <Play className="w-4 h-4 mr-2" />
              Record Workout
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="text-week-workouts">{weekWorkouts}</div>
                <div className="text-xs text-muted-foreground mt-1">Workouts This Week</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="text-week-minutes">{weekMinutes}</div>
                <div className="text-xs text-muted-foreground mt-1">Minutes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="text-week-calories">{weekCalories.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Calories Burned</div>
              </CardContent>
            </Card>
          </div>

          {myLogs.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Recent Workouts
              </h3>
              <div className="space-y-2">
                {myLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-md"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{log.activityName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.loggedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Timer className="w-3 h-3" />{log.duration}m
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <FireIcon className="w-3 h-3 text-orange-500" />{log.caloriesBurned}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!activePartner && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Select Your Profile</h3>
            <p className="text-sm text-muted-foreground">Tap your avatar in the header to get started with personalized workouts</p>
          </CardContent>
        </Card>
      )}

      <AiWorkoutGenerator partners={partners} activePartner={activePartner} />

      <div className="border-t pt-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-activities-title">Activity Suggestions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activePartner ? `Workouts for ${activePartner.name}` : "Fun ways to stay active together and separately"}
            </p>
          </div>
          <Button onClick={openCreate} data-testid="button-add-activity">
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "Together", "Individual"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(f)}
            data-testid={`button-filter-${f.toLowerCase()}`}
          >
            {f === "all" ? "All" : f}
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((activity) => {
          const Icon = getIcon(activity.iconName);
          return (
            <Card
              key={activity.id}
              className="hover-elevate active-elevate-2 cursor-pointer transition-all"
              onClick={() => {
                const hasExercises = parseExercises(activity);
                if (hasExercises) {
                  setDetailActivity(activity);
                  setExpandedExercise(null);
                } else {
                  setSelectedActivity(activity);
                }
              }}
              data-testid={`card-activity-${activity.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{activity.name}</h3>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            activity.type === "Together"
                              ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {activity.type}
                        </Badge>
                        {activity.exercises && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                            AI Plan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => openEdit(activity, e)}
                      data-testid={`button-edit-activity-${activity.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDelete(activity.id, e)}
                      data-testid={`button-delete-activity-${activity.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <div className="font-semibold text-foreground flex items-center justify-center gap-1">
                      <Timer className="w-3 h-3" />
                      {activity.duration}
                    </div>
                    <div className="text-muted-foreground mt-0.5">Duration</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <div className="font-semibold text-foreground flex items-center justify-center gap-1">
                      <FireIcon className="w-3 h-3" />
                      {activePartner
                        ? calculateCalories(activePartner, guessWorkoutType(activity.name), parseDurationMinutes(activity.duration))
                        : activity.calories}
                    </div>
                    <div className="text-muted-foreground mt-0.5">Est. Cal</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${difficultyColor(activity.difficulty)}`}>
                      {activity.difficulty}
                    </span>
                    <div className="text-muted-foreground mt-0.5">Level</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Record Workout Dialog */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Workout</DialogTitle>
            <DialogDescription>
              {activePartner
                ? `Log a workout for ${activePartner.name} (${activePartner.weightLbs} lbs)`
                : "Select your profile first"}
            </DialogDescription>
          </DialogHeader>
          {activePartner && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Workout Name (optional)</label>
                <Input
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                  placeholder="e.g. Morning Lift"
                  data-testid="input-record-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Workout Type</label>
                <Select value={recordType} onValueChange={setRecordType}>
                  <SelectTrigger data-testid="select-record-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_TYPES.map(t => (
                      <SelectItem key={t} value={t} data-testid={`option-type-${t.toLowerCase().replace(/\s/g, "-")}`}>
                        {t} (MET: {MET_VALUES[t]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Duration (minutes)</label>
                <Input
                  type="number"
                  value={recordDuration}
                  onChange={(e) => setRecordDuration(e.target.value)}
                  placeholder="60"
                  min="1"
                  data-testid="input-record-duration"
                />
              </div>

              <Card className="border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FireIcon className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-foreground">Estimated Calories Burned</span>
                    </div>
                    <span className="text-2xl font-bold text-primary" data-testid="text-estimated-calories">
                      {estimatedCalories}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {activePartner.name}'s weight ({activePartner.weightLbs} lbs) and {recordType} MET value ({MET_VALUES[recordType]})
                  </p>
                </CardContent>
              </Card>

              <Button
                className="w-full"
                onClick={handleRecordWorkout}
                disabled={isLogging || !recordDuration || parseInt(recordDuration) <= 0}
                data-testid="button-confirm-record"
              >
                {isLogging ? "Recording..." : "Record Workout"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exercise Detail Dialog */}
      <Dialog open={!!detailActivity} onOpenChange={() => setDetailActivity(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailActivity && (() => {
            const exercises = parseExercises(detailActivity) || [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">{detailActivity.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{detailActivity.duration}</span>
                    <span className="flex items-center gap-1">
                      <FireIcon className="w-3.5 h-3.5" />
                      ~{activePartner
                        ? calculateCalories(activePartner, guessWorkoutType(detailActivity.name), parseDurationMinutes(detailActivity.duration))
                        : detailActivity.calories} cal
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{detailActivity.difficulty}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{detailActivity.type}</Badge>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    Exercises ({exercises.length})
                  </h4>
                  {exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="border border-border rounded-md overflow-visible"
                      data-testid={`detail-exercise-${i}`}
                    >
                      <button
                        className="w-full flex items-center justify-between gap-2 p-3 text-left hover-elevate"
                        onClick={() => setExpandedExercise(expandedExercise === i ? null : i)}
                        data-testid={`button-expand-exercise-${i}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-primary w-5 shrink-0">{i + 1}</span>
                          <span className="text-sm font-medium text-foreground truncate">{ex.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-[10px]">{ex.muscleGroup}</Badge>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedExercise === i ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {expandedExercise === i && (
                        <div className="px-3 pb-3 pt-0 border-t border-border">
                          <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                            <div className="text-center p-1.5 bg-muted/50 rounded-md">
                              <div className="text-xs font-semibold text-foreground">{ex.sets} sets</div>
                              <div className="text-[10px] text-muted-foreground">Sets</div>
                            </div>
                            <div className="text-center p-1.5 bg-muted/50 rounded-md">
                              <div className="text-xs font-semibold text-foreground">{ex.reps}</div>
                              <div className="text-[10px] text-muted-foreground">Reps</div>
                            </div>
                            <div className="text-center p-1.5 bg-muted/50 rounded-md">
                              <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-0.5">
                                <Clock className="w-3 h-3" />{ex.restSeconds}s
                              </div>
                              <div className="text-[10px] text-muted-foreground">Rest</div>
                            </div>
                          </div>
                          {ex.formTip && (
                            <p className="text-xs text-muted-foreground bg-accent/40 p-2 rounded-md">
                              <span className="font-semibold text-foreground">Tip: </span>{ex.formTip}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {activePartner && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!detailActivity || !activePartner) return;
                        const dur = parseDurationMinutes(detailActivity.duration);
                        const wType = guessWorkoutType(detailActivity.name);
                        onLogWorkout({
                          partnerId: activePartner.id,
                          activityName: detailActivity.name,
                          duration: dur,
                          caloriesBurned: calculateCalories(activePartner, wType, dur),
                        });
                        setDetailActivity(null);
                      }}
                      disabled={isLogging}
                      data-testid="button-detail-log"
                    >
                      {isLogging ? "Logging..." : `Log for ${activePartner.name}`}
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Quick Log Dialog (non-AI activities) */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>
              {selectedActivity?.name} - {selectedActivity?.duration}
              {activePartner && selectedActivity && (
                <>, ~{calculateCalories(activePartner, guessWorkoutType(selectedActivity.name), parseDurationMinutes(selectedActivity.duration))} cal for {activePartner.name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {activePartner ? (
              <Button
                className="w-full"
                onClick={handleLog}
                disabled={isLogging}
                data-testid="button-confirm-log"
              >
                {isLogging ? "Logging..." : `Log for ${activePartner.name}`}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Select your profile in the header first</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Activity Dialog */}
      <Dialog open={!!formDialog} onOpenChange={() => { setEditingActivity(null); setIsCreating(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit Activity" : "New Activity"}</DialogTitle>
            <DialogDescription>
              {editingActivity ? "Modify this activity's details" : "Create a custom activity suggestion"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning Run"
                data-testid="input-activity-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="select-activity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Together">Together</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger data-testid="select-activity-difficulty">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Duration</label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 30 min"
                  data-testid="input-activity-duration"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Calories</label>
                <Input
                  type="number"
                  value={form.calories}
                  onChange={(e) => setForm({ ...form, calories: e.target.value })}
                  placeholder="e.g. 200"
                  data-testid="input-activity-calories"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((iconName) => {
                  const IconComp = iconMap[iconName] || Dumbbell;
                  return (
                    <Button
                      key={iconName}
                      size="icon"
                      variant={form.iconName === iconName ? "default" : "outline"}
                      onClick={() => setForm({ ...form, iconName })}
                      className="toggle-elevate"
                      data-testid={`button-icon-${iconName.toLowerCase()}`}
                    >
                      <IconComp className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving || !form.name.trim() || !form.duration.trim() || isNaN(parseInt(form.calories)) || parseInt(form.calories) <= 0}
              data-testid="button-save-activity"
            >
              {isSaving ? "Saving..." : editingActivity ? "Save Changes" : "Create Activity"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
