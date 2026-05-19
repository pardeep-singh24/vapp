import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell, Check, ListPlus, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, StickyNote, Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ReminderDialog } from "@/components/ReminderDialog";
import { actions, useStore, type CallLogEntry } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & Call Notes — Reminders" },
      { name: "description", content: "Add notes and reminders on recent calls or create manual tasks." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const calls = useStore((s) => s.calls);
  const tasks = useStore((s) => s.tasks);

  return (
    <div className="safe-bottom">
      <AppHeader title="Tasks" subtitle="Call notes and manual tasks" action={<NewTaskButton />} />

      <div className="px-5 pt-4">
        <Tabs defaultValue="calls" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/60 p-1">
            <TabsTrigger value="calls" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-card">
              Recent Calls
            </TabsTrigger>
            <TabsTrigger value="manual" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-card">
              My Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calls" className="mt-4 space-y-2.5">
            <p className="px-1 text-[11px] text-muted-foreground">
              Recent calls are shown below. Tap a call to add a note or set a reminder.
            </p>
            {calls.map((c) => (
              <CallRow key={c.id} call={c} />
            ))}
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-2.5">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <ListPlus className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No tasks yet. Tap “New” to create one.</p>
              </div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => actions.toggleTask(t.id)}
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        t.done ? "border-success bg-success text-success-foreground" : "border-border",
                      )}
                    >
                      {t.done && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold", t.done && "text-muted-foreground line-through")}>
                        {t.contactName}
                      </p>
                      <p className={cn("mt-0.5 text-sm text-foreground/80", t.done && "text-muted-foreground line-through")}>
                        {t.note}
                      </p>
                      {t.reminderAt && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          <Bell className="h-3 w-3" />
                          {format(new Date(t.reminderAt), "EEE, d MMM · h:mm a")}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { actions.deleteTask(t.id); toast.success("Task removed"); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CallRow({ call }: { call: CallLogEntry }) {
  const [open, setOpen] = useState(false);
  const [remOpen, setRemOpen] = useState(false);
  const [note, setNote] = useState(call.note || "");

  const Icon = call.direction === "incoming" ? PhoneIncoming : call.direction === "outgoing" ? PhoneOutgoing : PhoneMissed;
  const tone =
    call.direction === "missed" ? "text-destructive bg-destructive/10" :
    call.direction === "incoming" ? "text-success bg-success/10" :
    "text-primary bg-primary/10";

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{call.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {call.phone || "Unknown"} · {formatDistanceToNow(new Date(call.time), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={() => setOpen(true)} aria-label="Note">
            <StickyNote className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={() => setRemOpen(true)} aria-label="Reminder">
            <Bell className={cn("h-4 w-4", call.reminderAt && "text-primary")} />
          </Button>
        </div>
      </div>
      {(call.note || call.reminderAt) && (
        <div className="mt-2.5 space-y-1.5 border-t border-border pt-2.5">
          {call.note && (
            <p className="flex gap-1.5 text-sm text-foreground/80">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {call.note}
            </p>
          )}
          {call.reminderAt && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <Bell className="h-3 w-3" />
              {format(new Date(call.reminderAt), "EEE, d MMM · h:mm a")}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Note for {call.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was this call about?"
            rows={4}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="rounded-full"
              onClick={() => {
                actions.updateCall(call.id, { note: note.trim() || undefined });
                toast.success("Note saved");
                setOpen(false);
              }}
            >Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReminderDialog
        open={remOpen}
        onOpenChange={setRemOpen}
        initial={call.reminderAt}
        onSave={(iso) => {
          actions.updateCall(call.id, { reminderAt: iso ?? undefined });
          toast.success(iso ? "Reminder set" : "Reminder cleared");
        }}
        title={`Remind about ${call.name}`}
      />
    </div>
  );
}

function NewTaskButton() {
  const [open, setOpen] = useState(false);
  const [remOpen, setRemOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [reminderAt, setReminderAt] = useState<string | undefined>();

  function save() {
    if (!name.trim() || !note.trim()) return toast.error("Add a name and note");
    actions.addTask({
      contactName: name.trim(),
      phone: phone.trim() || undefined,
      note: note.trim(),
      reminderAt,
      source: "manual",
    });
    toast.success("Task created");
    setName(""); setNote(""); setPhone(""); setReminderAt(undefined);
    setOpen(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-10 rounded-full px-4 shadow-card">
            <ListPlus className="mr-1 h-4 w-4" /> New
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tname">Contact name</Label>
              <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mohit" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tphone">Phone (optional)</Label>
              <Input id="tphone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tnote">Note</Label>
              <Textarea id="tnote" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="rounded-xl" placeholder="What needs to be done?" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-start rounded-xl font-normal"
              onClick={() => setRemOpen(true)}
            >
              <Bell className="mr-2 h-4 w-4 text-primary" />
              {reminderAt ? format(new Date(reminderAt), "EEE, d MMM · h:mm a") : "Add reminder (optional)"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={save}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReminderDialog open={remOpen} onOpenChange={setRemOpen} initial={reminderAt} onSave={(iso) => setReminderAt(iso ?? undefined)} />
    </>
  );
}
