import { NavLink } from "react-router-dom";
import { Calendar, Wallet, Users, Settings, Scissors } from "lucide-react";
import { useAuth } from "@/App";

export const BottomNav = () => {
  const { isOwner } = useAuth();

  const navItems = [
    { to: "/", icon: Calendar, label: "Today" },
    { to: "/money", icon: Wallet, label: "Money" },
    { to: "/orders", icon: Scissors, label: "Orders" },
    { to: "/clients", icon: Users, label: "Clients" },
  ];

  if (isOwner) {
    navItems.push({ to: "/settings", icon: Settings, label: "Settings" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 bottom-nav z-40" data-testid="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-4 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
                />
                <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
