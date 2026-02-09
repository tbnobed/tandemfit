import { Flame, Check } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import type { Partner } from "@shared/schema";
import logoPath from "../assets/logo.png";

interface HeaderProps {
  partners: Partner[];
  activePartnerId: string | null;
  onSelectPartner: (id: string) => void;
}

export function Header({ partners, activePartnerId, onSelectPartner }: HeaderProps) {
  const streak = partners.length > 0 ? Math.max(...partners.map(p => p.streak)) : 0;
  const activePartner = partners.find(p => p.id === activePartnerId);

  return (
    <header className="bg-gradient-to-r from-[hsl(320,85%,45%)] via-[hsl(340,80%,50%)] to-[hsl(25,90%,55%)] dark:from-[hsl(320,85%,35%)] dark:via-[hsl(340,80%,40%)] dark:to-[hsl(25,90%,45%)] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="TandemFit" className="w-9 h-9 rounded-md object-cover" data-testid="img-logo" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TandemFit</h1>
              {activePartner && (
                <p className="text-xs text-white/70 mt-0.5" data-testid="text-active-user">
                  Logged in as <span className="font-semibold text-white/90">{activePartner.name}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {streak > 0 && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-semibold" data-testid="text-streak-count">
                <Flame className="w-4 h-4 text-orange-300" />
                <span>{streak} Day Streak</span>
              </div>
            )}
            <div className="flex gap-1.5">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => onSelectPartner(partner.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all relative ${
                    partner.color === "blue"
                      ? "bg-blue-500"
                      : "bg-pink-500"
                  } ${
                    activePartnerId === partner.id
                      ? "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110"
                      : "opacity-60 hover:opacity-90"
                  }`}
                  data-testid={`avatar-${partner.name.toLowerCase()}`}
                >
                  {partner.name[0]}
                  {activePartnerId === partner.id && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center border border-white">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
