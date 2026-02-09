import { Heart, MessageCircle, Trophy, Zap, Target, Star, Send, Dumbbell, Clock, RotateCcw, Pencil, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import type { Partner, Challenge, MotivationMessage, WorkoutLog } from "@shared/schema";

interface DashboardTabProps {
  partners: Partner[];
  activePartner: Partner | null;
  challenges: Challenge[];
  messages: MotivationMessage[];
  workoutLogs: WorkoutLog[];
  onSendMessage: (message: string) => void;
  onUpdateGoals: (partnerId: string, weeklyGoal: number, calorieGoal: number) => void;
  isSending: boolean;
  isUpdatingGoals: boolean;
}

function getWeeklyCompletedCount(logs: WorkoutLog[], partnerId: string): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return logs.filter(
    (log) =>
      log.partnerId === partnerId &&
      new Date(log.loggedAt) >= startOfWeek
  ).length;
}

function getWeeklyWorkouts(logs: WorkoutLog[], partnerId: string): WorkoutLog[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return logs
    .filter(
      (log) =>
        log.partnerId === partnerId &&
        new Date(log.loggedAt) >= startOfWeek
    )
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
}

function getTodayCalories(logs: WorkoutLog[], partnerId: string): number {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  return logs
    .filter(
      (log) =>
        log.partnerId === partnerId &&
        new Date(log.loggedAt) >= startOfDay
    )
    .reduce((sum, log) => sum + log.caloriesBurned, 0);
}

export function DashboardTab({
  partners,
  activePartner,
  challenges,
  messages,
  workoutLogs,
  onSendMessage,
  onUpdateGoals,
  isSending,
  isUpdatingGoals,
}: DashboardTabProps) {
  const [newMessage, setNewMessage] = useState("");
  const [flippedPartner, setFlippedPartner] = useState<string | null>(null);
  const [editingGoals, setEditingGoals] = useState<string | null>(null);
  const [editWeekly, setEditWeekly] = useState(0);
  const [editCalorie, setEditCalorie] = useState(0);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const activeChallenges = challenges.filter((c) => c.active).slice(0, 2);

  const myWeeklyWorkouts = activePartner ? getWeeklyCompletedCount(workoutLogs, activePartner.id) : 0;
  const myTodayCalories = activePartner ? getTodayCalories(workoutLogs, activePartner.id) : 0;
  const myGoalHit = activePartner ? activePartner.weeklyGoal > 0 && myWeeklyWorkouts >= activePartner.weeklyGoal : false;

  const partnerOther = activePartner ? partners.find(p => p.id !== activePartner.id) : null;
  const partnerOtherWeekly = partnerOther ? getWeeklyCompletedCount(workoutLogs, partnerOther.id) : 0;
  const bothHitGoal = myGoalHit && partnerOther && partnerOther.weeklyGoal > 0 && partnerOtherWeekly >= partnerOther.weeklyGoal;

  const getBannerContent = (): { title: string; subtitle: string } => {
    const name = activePartner?.name || "You";
    if (bothHitGoal) {
      return {
        title: "Weekly Goals Crushed!",
        subtitle: `Both you and ${partnerOther?.name} hit your goals this week!`,
      };
    }
    if (myGoalHit) {
      return {
        title: `${name}, You Did It!`,
        subtitle: "You hit your weekly workout goal. Keep the momentum going!",
      };
    }
    if (myTodayCalories > 500) {
      return {
        title: "On Fire Today!",
        subtitle: `${myTodayCalories} calories burned today. Incredible effort, ${name}!`,
      };
    }
    if (myWeeklyWorkouts >= 3) {
      return {
        title: "Staying Consistent!",
        subtitle: `${myWeeklyWorkouts} workouts this week. You're building great habits, ${name}!`,
      };
    }
    if (myWeeklyWorkouts > 0) {
      return {
        title: `Great Start, ${name}!`,
        subtitle: `${myWeeklyWorkouts} workout${myWeeklyWorkouts > 1 ? "s" : ""} logged this week. Keep going!`,
      };
    }
    return {
      title: `Ready to Move, ${name}?`,
      subtitle: "Start your first workout of the week!",
    };
  };

  const banner = getBannerContent();

  return (
    <div className="space-y-6">
      <Card className="overflow-visible border-0 bg-gradient-to-r from-[hsl(320,85%,45%)] to-[hsl(340,80%,50%)] dark:from-[hsl(320,85%,35%)] dark:to-[hsl(340,80%,40%)] text-white">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1" data-testid="text-motivation-banner">
                {banner.title}
              </h2>
              <p className="text-white/80 text-sm sm:text-base" data-testid="text-motivation-subtitle">
                {banner.subtitle}
              </p>
            </div>
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 fill-white/20 text-white/20 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {partners.map((partner) => {
          const weeklyCompleted = getWeeklyCompletedCount(workoutLogs, partner.id);
          const weeklyWorkoutList = getWeeklyWorkouts(workoutLogs, partner.id);
          const todayCalories = getTodayCalories(workoutLogs, partner.id);
          const weeklyPercent = Math.min(
            Math.round((weeklyCompleted / partner.weeklyGoal) * 100),
            100
          );
          const caloriePercent = Math.min(
            Math.round((todayCalories / partner.calorieGoal) * 100),
            100
          );
          const isBlue = partner.color === "blue";

          const isFlipped = flippedPartner === partner.id;
          const totalWeeklyCals = weeklyWorkoutList.reduce((s, l) => s + l.caloriesBurned, 0);
          const totalWeeklyMins = weeklyWorkoutList.reduce((s, l) => s + l.duration, 0);

          return (
            <div
              key={partner.id}
              className="flip-card cursor-pointer"
              onClick={() => setFlippedPartner(isFlipped ? null : partner.id)}
              data-testid={`card-partner-${partner.name.toLowerCase()}`}
            >
              <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
                <div className="flip-card-front">
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              isBlue ? "bg-blue-500" : "bg-pink-500"
                            }`}
                          >
                            {partner.name[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-base" data-testid={`text-partner-name-${partner.name.toLowerCase()}`}>{partner.name}</h3>
                            <p className="text-xs text-muted-foreground">This Week</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {editingGoals !== partner.id && activePartner?.id === partner.id && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoals(partner.id);
                                setEditWeekly(partner.weeklyGoal);
                                setEditCalorie(partner.calorieGoal);
                              }}
                              data-testid={`button-edit-goals-${partner.name.toLowerCase()}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          <Dumbbell className={`w-5 h-5 ${isBlue ? "text-blue-400" : "text-pink-400"}`} />
                        </div>
                      </div>

                      {editingGoals === partner.id ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Weekly Workout Goal</label>
                            <Input
                              type="number"
                              min={1}
                              max={14}
                              value={editWeekly}
                              onChange={(e) => setEditWeekly(parseInt(e.target.value) || 1)}
                              data-testid={`input-weekly-goal-${partner.name.toLowerCase()}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Daily Calorie Burn Goal</label>
                            <Input
                              type="number"
                              min={100}
                              step={50}
                              value={editCalorie}
                              onChange={(e) => setEditCalorie(parseInt(e.target.value) || 100)}
                              data-testid={`input-calorie-goal-${partner.name.toLowerCase()}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              disabled={isUpdatingGoals}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateGoals(partner.id, editWeekly, editCalorie);
                                setEditingGoals(null);
                              }}
                              data-testid={`button-save-goals-${partner.name.toLowerCase()}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save Goals
                            </Button>
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoals(null);
                              }}
                              data-testid={`button-cancel-goals-${partner.name.toLowerCase()}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between gap-2 text-sm mb-2">
                                <span className="font-medium text-foreground">Weekly Workouts</span>
                                <span className={`font-bold ${isBlue ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`} data-testid={`text-weekly-progress-${partner.name.toLowerCase()}`}>
                                  {weeklyCompleted}/{partner.weeklyGoal}
                                  {weeklyPercent >= 100 ? " (Done!)" : ""}
                                </span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    isBlue ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-pink-500 to-pink-600"
                                  }`}
                                  style={{ width: `${weeklyPercent}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between gap-2 text-sm mb-2">
                                <span className="font-medium text-foreground">Calories Burned Today</span>
                                <span className={`font-bold ${isBlue ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`} data-testid={`text-calorie-progress-${partner.name.toLowerCase()}`}>
                                  {todayCalories}/{partner.calorieGoal}
                                </span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                                  style={{ width: `${caloriePercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-4">Tap to see workouts</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flip-card-back">
                  <Card className="h-full">
                    <CardContent className="p-5 h-full flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              isBlue ? "bg-blue-500" : "bg-pink-500"
                            }`}
                          >
                            {partner.name[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{partner.name}'s Workouts</h3>
                            <p className="text-xs text-muted-foreground">This Week</p>
                          </div>
                        </div>
                        <RotateCcw className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {weeklyWorkoutList.length > 0 ? (
                        <>
                          <div className="flex gap-3 mb-3">
                            <div className={`flex-1 rounded-md p-2 text-center ${isBlue ? "bg-blue-500/10" : "bg-pink-500/10"}`}>
                              <p className={`text-lg font-bold ${isBlue ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`}>{weeklyWorkoutList.length}</p>
                              <p className="text-[10px] text-muted-foreground">Workouts</p>
                            </div>
                            <div className={`flex-1 rounded-md p-2 text-center ${isBlue ? "bg-blue-500/10" : "bg-pink-500/10"}`}>
                              <p className={`text-lg font-bold ${isBlue ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`}>{totalWeeklyMins}</p>
                              <p className="text-[10px] text-muted-foreground">Minutes</p>
                            </div>
                            <div className={`flex-1 rounded-md p-2 text-center ${isBlue ? "bg-blue-500/10" : "bg-pink-500/10"}`}>
                              <p className={`text-lg font-bold ${isBlue ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`}>{totalWeeklyCals}</p>
                              <p className="text-[10px] text-muted-foreground">Calories</p>
                            </div>
                          </div>
                          <div className="space-y-1.5 flex-1 overflow-y-auto">
                            {weeklyWorkoutList.map((log) => {
                              const logDate = new Date(log.loggedAt);
                              const dayName = logDate.toLocaleDateString("en-US", { weekday: "short" });
                              return (
                                <div
                                  key={log.id}
                                  className="flex items-center justify-between gap-2 text-xs p-2 bg-accent/40 rounded-md"
                                  data-testid={`workout-log-${log.id}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`font-semibold shrink-0 ${isBlue ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`}>
                                      {dayName}
                                    </span>
                                    <span className="text-foreground truncate">{log.activityName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" />
                                      {log.duration}m
                                    </span>
                                    <span>{log.caloriesBurned} cal</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">No workouts logged this week yet</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground text-center mt-3">Tap to flip back</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Motivation Feed
          </h3>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No messages yet. Send some encouragement!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 p-3 bg-accent/50 rounded-md"
                  data-testid={`message-${msg.id}`}
                >
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{msg.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Send encouragement..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
              data-testid="input-motivation-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeChallenges.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-chart-3" />
              Active Challenges
            </h3>
            <div className="space-y-4">
              {activeChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="border border-border rounded-md p-4"
                  data-testid={`challenge-preview-${challenge.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {challenge.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {challenge.description}
                      </p>
                    </div>
                    <Trophy className="w-5 h-5 text-chart-3 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={challenge.progress} className="flex-1 h-2" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {challenge.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
