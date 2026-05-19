import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ArrowDownLeft, ArrowUpRight, Check } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useStore, type TxnCategory, type TxnType } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: TxnCategory[] = [
  "Cash loan",
  "Business payment",
  "Shop purchase",
  "Rent",
  "Personal",
  "Other",
];

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Entry — Khata Ledger" },
      { name: "description", content: "Record money given or received for a client." },
    ],
  }),
  component: AddEntryPage,
});

function AddEntryPage() {
  const clients = useStore((s) => s.clients);
  const navigate = useNavigate();
  const [type, setType] = useState<TxnType>("given");
  const [clientId, setClientId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TxnCategory>("Cash loan");
  const [customNote, setCustomNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  function submit() {
    if (!clientId) return toast.error("Choose a client");
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter a valid amount");
    actions.addTransaction({
      clientId,
      type,
      amount: n,
      category,
      note: customNote.trim() || undefined,
      date: date.toISOString(),
    });
    toast.success(type === "given" ? "Given recorded" : "Received recorded");
    navigate({ to: "/clients/$id", params: { id: clientId } });
  }

  return (
    <div className="safe-bottom">
      <AppHeader title="Add Entry" subtitle="Record money given or received" />

      <div className="space-y-5 px-5 pt-5">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1.5">
          <TypeToggle active={type === "given"} onClick={() => setType("given")} tone="success" label="You gave" icon={<ArrowUpRight className="h-4 w-4" />} />
          <TypeToggle active={type === "received"} onClick={() => setType("received")} tone="destructive" label="You received" icon={<ArrowDownLeft className="h-4 w-4" />} />
        </div>

        <div className="space-y-1.5">
          <Label>Client</Label>
          {clients.length === 0 ? (
            <Link
              to="/"
              className="flex h-12 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground"
            >
              No clients yet — add one first
            </Link>
          ) : (
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amt">Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">₹</span>
            <Input
              id="amt"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              className="h-14 rounded-xl pl-9 text-2xl font-bold tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as TxnCategory)}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {category === "Other" ? (
            <Input
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Type description..."
              className="mt-2 h-11 rounded-xl"
            />
          ) : (
            <Input
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add note (optional)"
              className="mt-2 h-11 rounded-xl"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-12 w-full justify-start rounded-xl border-input font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "EEEE, d MMM yyyy")}
                {format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
                  <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">Today</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={submit}
          size="lg"
          className={cn(
            "h-14 w-full rounded-2xl text-base font-semibold shadow-elev",
            type === "given" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          )}
        >
          <Check className="mr-1.5 h-5 w-5" />
          Save {type === "given" ? "given" : "received"} entry
        </Button>
      </div>
    </div>
  );
}

function TypeToggle({
  active, onClick, tone, label, icon,
}: {
  active: boolean;
  onClick: () => void;
  tone: "success" | "destructive";
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
        active && tone === "success" && "bg-success text-success-foreground shadow-card",
        active && tone === "destructive" && "bg-destructive text-destructive-foreground shadow-card",
        !active && "text-muted-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
