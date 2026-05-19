import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, TrendingDown, TrendingUp, UserPlus, ChevronRight, Wallet, Contact } from "lucide-react";
import { pickContact, supportsContactPicker } from "@/lib/contacts";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { actions, clientBalance, formatINR, useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clients — Khata Ledger" },
      { name: "description", content: "All your khata clients and balances at a glance." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const clients = useStore((s) => s.clients);
  const transactions = useStore((s) => s.transactions);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const totals = useMemo(() => {
    let toReceive = 0;
    let toPay = 0;
    for (const c of clients) {
      const b = clientBalance(c.id, transactions);
      if (b > 0) toReceive += b;
      else if (b < 0) toPay += -b;
    }
    return { toReceive, toPay };
  }, [clients, transactions]);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="safe-bottom">
      <AppHeader
        title="Khata"
        subtitle={`${clients.length} ${clients.length === 1 ? "client" : "clients"} · personal ledger`}
        action={<AddClientButton />}
      />

      <div className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="To Receive"
            value={formatINR(totals.toReceive)}
            tone="success"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <SummaryCard
            label="To Pay"
            value={formatINR(totals.toPay)}
            tone="destructive"
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients..."
            className="h-11 rounded-full border-border bg-card pl-10 shadow-card"
          />
        </div>
      </div>

      <div className="px-5 pt-5">
        {filtered.length === 0 ? (
          <EmptyState
            onAdd={() => {
              const el = document.getElementById("add-client-trigger");
              el?.click();
            }}
            hasQuery={q.length > 0}
          />
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((c) => {
              const bal = clientBalance(c.id, transactions);
              const initials = c.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <li key={c.id}>
                  <button
                    onClick={() => navigate({ to: "/clients/$id", params: { id: c.id } })}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-card transition-all active:scale-[0.99] hover:shadow-elev"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                      {initials || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{c.name}</p>
                      {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={cn(
                          "text-base font-bold tabular-nums",
                          bal > 0 && "text-success",
                          bal < 0 && "text-destructive",
                          bal === 0 && "text-muted-foreground",
                        )}
                      >
                        {bal === 0 ? "—" : formatINR(bal)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {bal > 0 ? "to receive" : bal < 0 ? "to pay" : "settled"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        to="/add"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "success" | "destructive";
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-15",
          tone === "success" ? "bg-success" : "bg-destructive",
        )}
      />
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <p className={cn("mt-2 text-xl font-bold tabular-nums", tone === "success" ? "text-success" : "text-destructive")}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ onAdd, hasQuery }: { onAdd: () => void; hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">No clients match your search.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Wallet className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">Start your khata</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first client to track money given and received.
      </p>
      <Button onClick={onAdd} className="mt-4 rounded-full">
        <UserPlus className="mr-1.5 h-4 w-4" /> Add client
      </Button>
    </div>
  );
}

function AddClientButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const canImportContacts = supportsContactPicker();

  async function importFromContacts() {
    try {
      const picked = await pickContact();
      if (!picked) return;
      setName(picked.name);
      setPhone(picked.phone ?? "");
      setOpen(true);
    } catch {
      toast.error("Could not access contacts");
    }
  }

  function submit() {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    actions.addClient(name.trim(), phone.trim() || undefined);
    toast.success(`${name.trim()} added`);
    setName("");
    setPhone("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1.5">
        {canImportContacts && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10 rounded-full px-3 shadow-card"
            onClick={importFromContacts}
          >
            <Contact className="h-4 w-4" />
          </Button>
        )}
        <DialogTrigger asChild>
          <Button id="add-client-trigger" size="sm" className="h-10 rounded-full px-4 shadow-card">
            <UserPlus className="mr-1 h-4 w-4" /> Add
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cphone">Phone (optional)</Label>
            <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" inputMode="tel" />
          </div>
          {!canImportContacts && (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Enter client details manually, or grant contacts permission in the Android app.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
          <Button onClick={submit} className="rounded-full">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
