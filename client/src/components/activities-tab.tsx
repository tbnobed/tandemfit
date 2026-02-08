import {
  Dumbbell, Mountain, Waves, Bike, Zap, Music, Timer, Flame as FireIcon, BarChart3,
  HeartPulse, Footprints, PersonStanding
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Activity, Partner } from "@shared/schema";
import { AiWorkoutGenerator } from "./ai-workout-generator";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mountain, Waves, PersonStanding, Bike, Zap, Music, Dumbbell,
  HeartPulse, Footprints, Timer, BarChart3,
};

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
}

export function ActivitiesTab({ activities, partners, onLogWorkout, isLogging }: ActivitiesTabProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");

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

  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (d === "Hard") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  };

  return (
    <div className="space-y-8">
      <AiWorkoutGenerator partners={partners} />

      <div className="border-t pt-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-activities-title">Activity Suggestions</h2>
        <p className="text-sm text-muted-foreground mt-1">Fun ways to stay active together and separately</p>
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
    </div>
  );
}
