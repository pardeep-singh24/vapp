import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Bell, BellOff, Check, Phone, PhoneCall } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — Khata & Tasks" },
      { name: "description", content: "All upcoming reminders from calls and manual tasks in one place." },
    ],
  }),
  component: RemindersPage,
});

interface Reminder {
  id: string;
  source: "call" | "task";
  title: string;
  subtitle?: string;
  phone?: string;
  at: string;
  done?: boolean;
  origin: { type: "call" | "task"; id: string };
}

function RemindersPage() {
  const calls = useStore((s) => s.calls);
  const tasks = useStore((s) => s.tasks);

  const reminders = useMemo<Reminder[]>(() => {
    const r: Reminder[] = [];
    for (const c of calls) {
      if (c.reminderAt) {
        r.push({
          id: "c-" + c.id, source: "call", title: c.name, subtitle: c.note || "Follow-up call",
          phone: c.phone, at: c.reminderAt, origin: { type: "call", id: c.id },
        });
      }
    }
    for (const t of tasks) {
      if (t.reminderAt) {
        r.push({
          id: "t-" + t.id, source: "task", title: t.contactName, subtitle: t.note,
          phone: t.phone, at: t.reminderAt, done: t.done, origin: { type: "task", id: t.id },
        });
      }
    }
    return r.sort((a, b) => +new Date(a.at) - +new Date(b.at));
  }, [calls, tasks]);

  const overdue = reminders.filter((r) => !r.done && isPast(new Date(r.at)));
  const upcoming = reminders.filter((r) => !r.done && !isPast(new Date(r.at)));
  const completed = reminders.filter((r) => r.done);

  return (
    <div className="safe-bottom">
      <AppHeader title="Reminders" subtitle={`${upcoming.length + overdue.length} active reminders`} />

      <div className="space-y-6 px-5 pt-5">
        {reminders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <BellOff className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No reminders yet.</p>
            <p className="text-xs text-muted-foreground">Set one from a call or a task.</p>
          </div>
        )}

        {overdue.length > 0 && (
          <Section title="Overdue" tone="destructive" items={overdue} />
        )}
        {upcoming.length > 0 && (
          <Section title="Upcoming" tone="primary" items={upcoming} />
        )}
        {completed.length > 0 && (
          <Section title="Completed" tone="muted" items={completed} />
        )}
      </div>
    </div>
  );
}

function Section({ title, tone, items }: { title: string; tone: "destructive" | "primary" | "muted"; items: Reminder[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            tone === "destructive" && "bg-destructive",
            tone === "primary" && "bg-primary",
            tone === "muted" && "bg-muted-foreground",
          )}
        />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">· {items.length}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((r) => <ReminderCard key={r.id} r={r} />)}
      </ul>
    </div>
  );
}

function ReminderCard({ r }: { r: Reminder }) {
  const at = new Date(r.at);
  const when = isToday(at) ? `Today · ${format(at, "h:mm a")}`
    : isTomorrow(at) ? `Tomorrow · ${format(at, "h:mm a")}`
    : format(at, "EEE, d MMM · h:mm a");

  const overdue = !r.done && isPast(at);

  function complete() {
    if (r.origin.type === "task") actions.toggleTask(r.origin.id);
    else actions.updateCall(r.origin.id, { reminderAt: undefined });
  }

  return (
    <li className={cn("rounded-2xl border bg-card p-4 shadow-card", overdue ? "border-destructive/40" : "border-border", r.done && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          r.source === "call" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground",
        )}>
          {r.source === "call" ? <PhoneCall className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold", r.done && "line-through")}>{r.title}</p>
          {r.subtitle && <p className="truncate text-sm text-muted-foreground">{r.subtitle}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              overdue ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary",
            )}>
              <Bell className="h-3 w-3" /> {when}
            </span>
            {r.phone && (
              <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                <Phone className="h-3 w-3" /> Call
              </a>
            )}
          </div>
        </div>
        {!r.done && (
          <button
            onClick={complete}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success transition-colors hover:bg-success hover:text-success-foreground"
            aria-label="Mark done"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
