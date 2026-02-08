import { Flame } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import type { Partner } from "@shared/schema";
import logoPath from "@assets/image_1770592476016.png";

interface HeaderProps {
  partners: Partner[];
}

export function Header({ partners }: HeaderProps) {
  const streak = partners.length > 0 ? Math.max(...partners.map(p => p.streak)) : 0;

  return (
    <header className="bg-gradient-to-r from-[hsl(320,85%,45%)] via-[hsl(340,80%,50%)] to-[hsl(25,90%,55%)] dark:from-[hsl(320,85%,35%)] dark:via-[hsl(340,80%,40%)] dark:to-[hsl(25,90%,45%)] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="TandemFit" className="w-9 h-9 rounded-md object-cover" data-testid="img-logo" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TandemFit</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {streak > 0 && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-semibold" data-testid="text-streak-count">
                <Flame className="w-4 h-4 text-orange-300" />
                <span>{streak} Day Streak</span>
              </div>
            )}
            <div className="flex -space-x-2">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className={`w-9 h-9 rounded-full border-2 border-white/80 flex items-center justify-center font-bold text-sm ${
                    partner.color === "blue"
                      ? "bg-blue-500"
                      : "bg-pink-500"
                  }`}
                  data-testid={`avatar-${partner.name.toLowerCase()}`}
                >
                  {partner.name[0]}
                </div>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
