import { Link, useLocation } from "@tanstack/react-router";
import { Users, PlusCircle, ListTodo, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Clients", icon: Users },
  { to: "/add", label: "Add Entry", icon: PlusCircle },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/reminders", label: "Reminders", icon: Bell },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((it) => {
          const active =
            it.to === "/" ? pathname === "/" || pathname.startsWith("/clients") : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-all",
                  active && "bg-accent",
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              </span>
              <span className={cn("text-[11px] font-medium tracking-wide", active && "font-semibold")}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
