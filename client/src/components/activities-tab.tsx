import {
  Dumbbell, Mountain, Waves, Bike, Zap, Music, Timer, Flame as FireIcon, BarChart3,
  HeartPulse, Footprints, PersonStanding, Pencil, Trash2, Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Activity, Partner } from "@shared/schema";
import { AiWorkoutGenerator } from "./ai-workout-generator";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mountain, Waves, PersonStanding, Bike, Zap, Music, Dumbbell,
  HeartPulse, Footprints, Timer, BarChart3,
};

const iconOptions = ["Dumbbell", "Mountain", "Waves", "Bike", "Zap", "Music", "HeartPulse", "Footprints", "Timer", "BarChart3", "PersonStanding"];

function getIcon(name: string) {
  return iconMap[name] || Dumbbell;
}

interface ActivitiesTabProps {
  activities: Activity[];
  partners: Partner[];
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

export function ActivitiesTab({ activities, partners, onLogWorkout, isLogging, onCreateActivity, onUpdateActivity, onDeleteActivity, isSaving }: ActivitiesTabProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ActivityFormState>(defaultForm);

  const filtered = filter === "all"
    ? activities
    : activities.filter((a) => a.type === filter);

  const handleLog = () => {
    if (!selectedActivity || !selectedPartner) return;
    onLogWorkout({
      partnerId: selectedPartner,
      activityName: selectedActivity.name,
      duration: parseInt(selectedActivity.duration),
      caloriesBurned: selectedActivity.calories,
    });
    setSelectedActivity(null);
    setSelectedPartner("");
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

  return (
    <div className="space-y-8">
      <AiWorkoutGenerator partners={partners} />

      <div className="border-t pt-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-activities-title">Activity Suggestions</h2>
            <p className="text-sm text-muted-foreground mt-1">Fun ways to stay active together and separately</p>
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
              onClick={() => setSelectedActivity(activity)}
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
                      <Badge
                        variant="secondary"
                        className={`text-[10px] mt-1 ${
                          activity.type === "Together"
                            ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}
                      >
                        {activity.type}
                      </Badge>
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
                      {activity.calories}
                    </div>
                    <div className="text-muted-foreground mt-0.5">Calories</div>
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

      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>
              {selectedActivity?.name} - {selectedActivity?.duration}, ~{selectedActivity?.calories} cal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Who completed this?</label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger data-testid="select-partner-log">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id} data-testid={`option-partner-${p.name.toLowerCase()}`}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleLog}
              disabled={!selectedPartner || isLogging}
              data-testid="button-confirm-log"
            >
              {isLogging ? "Logging..." : "Log Workout"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
