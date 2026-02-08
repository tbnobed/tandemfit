import { Award, Trophy, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Challenge, Badge as BadgeType } from "@shared/schema";

const badgeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award, Trophy, ArrowUp,
};

function getBadgeIcon(name: string) {
  return badgeIconMap[name] || Award;
}

interface ChallengesTabProps {
  challenges: Challenge[];
  badges: BadgeType[];
  onUpdateProgress: (id: string, progress: number) => void;
  isUpdating: boolean;
}

export function ChallengesTab({ challenges, badges, onUpdateProgress, isUpdating }: ChallengesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-challenges-title">Couple Challenges</h2>
        <p className="text-sm text-muted-foreground mt-1">Achieve goals together and earn rewards</p>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge) => {
          const isComplete = challenge.progress >= challenge.goal;
          return (
            <Card key={challenge.id} data-testid={`card-challenge-${challenge.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">{challenge.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{challenge.description}</p>
                  </div>
                  <Award className={`w-6 h-6 flex-shrink-0 ${isComplete ? "text-yellow-500" : "text-muted-foreground"}`} />
                </div>

                <div className="mb-4">
                  <div className="flex justify-between gap-2 text-sm mb-2">
                    <span className="font-medium text-foreground">Progress</span>
                    <span className="font-bold text-primary">{challenge.progress}%</span>
                  </div>
                  <Progress value={challenge.progress} className="h-3" />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 bg-accent/50 rounded-md">
                  <div>
                    <span className="text-xs text-muted-foreground">Reward:</span>
                    <span className="text-sm font-bold text-foreground ml-2">{challenge.reward}</span>
                  </div>
                  {!isComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onUpdateProgress(
                          challenge.id,
                          Math.min(challenge.progress + 10, 100)
                        )
                      }
                      disabled={isUpdating}
                      data-testid={`button-progress-${challenge.id}`}
                    >
                      <ArrowUp className="w-3 h-3 mr-1" />
                      +10%
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {badges.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-chart-3" />
              Earned Badges
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {badges.map((badge) => {
                const Icon = getBadgeIcon(badge.iconName);
                return (
                  <div
                    key={badge.id}
                    className="text-center p-3 bg-gradient-to-br from-primary/10 to-accent/30 rounded-md"
                    data-testid={`badge-${badge.id}`}
                  >
                    <Icon className="w-7 h-7 text-primary mx-auto mb-1" />
                    <div className="text-[10px] font-medium text-muted-foreground">
                      Week {badge.weekNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
