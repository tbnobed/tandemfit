import { useState } from "react";
import { Dumbbell, Heart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Partner } from "@shared/schema";
import logoPath from "../assets/logo.png";

interface SplashScreenProps {
  partners: Partner[];
  onSelectPartner: (id: string) => void;
}

export function SplashScreen({ partners, onSelectPartner }: SplashScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      onSelectPartner(selected);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(320,85%,45%)] via-[hsl(340,80%,50%)] to-[hsl(25,90%,55%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
              <img src={logoPath} alt="TandemFit" className="w-full h-full object-cover" data-testid="img-splash-logo" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight" data-testid="text-splash-title">TandemFit</h1>
            <p className="text-white/70 mt-2 text-lg">Your couples fitness journey</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Dumbbell className="w-4 h-4 text-white/50" />
            <Heart className="w-4 h-4 text-white/50" />
            <Dumbbell className="w-4 h-4 text-white/50" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-center text-white/80 font-medium text-sm" data-testid="text-splash-prompt">Who's working out today?</p>
          <div className="grid grid-cols-2 gap-4">
            {partners.map((partner) => {
              const isSelected = selected === partner.id;
              const colorClass = partner.color === "blue"
                ? "from-blue-500 to-blue-600"
                : "from-pink-500 to-pink-600";
              const ringClass = partner.color === "blue"
                ? "ring-blue-300"
                : "ring-pink-300";

              return (
                <Card
                  key={partner.id}
                  onClick={() => setSelected(partner.id)}
                  className={`cursor-pointer transition-all duration-200 border-0 overflow-visible ${
                    isSelected
                      ? `ring-3 ${ringClass} scale-[1.03]`
                      : "opacity-80 hover:opacity-100"
                  }`}
                  data-testid={`splash-partner-${partner.name.toLowerCase()}`}
                >
                  <div className="p-5 flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                      {partner.name[0]}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-base" data-testid={`text-splash-name-${partner.name.toLowerCase()}`}>{partner.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{partner.fitnessLevel}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full bg-white text-[hsl(320,85%,40%)] hover:bg-white/90 font-semibold text-base py-5 shadow-lg shadow-black/10 disabled:opacity-40 disabled:shadow-none"
          data-testid="button-splash-continue"
        >
          Let's Go
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
