import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Phone, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { actions, clientBalance, formatINR, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/clients/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Client ledger — ${params.id}` },
      { name: "description", content: "Bank-passbook style transaction history for this client." },
    ],
  }),
  component: ClientPage,
});

function ClientPage() {
  const { id } = Route.useParams();
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const txns = useStore((s) =>
    s.transactions.filter((t) => t.clientId === id).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
  );
  const navigate = useNavigate();

  const bal = useMemo(() => clientBalance(id, txns), [id, txns]);

  if (!client) {
    return (
      <div className="safe-bottom px-5 pt-10 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back to clients</Link>
      </div>
    );
  }

  const grouped = groupByDay(txns);

  function remove() {
    if (!confirm(`Delete ${client?.name} and all their transactions?`)) return;
    actions.deleteClient(id);
    toast.success("Client deleted");
    navigate({ to: "/" });
  }

  return (
    <div className="safe-bottom">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 pt-5 pb-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{client.name}</h1>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {client.phone}
              </a>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-destructive" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="px-5 pt-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl p-5 text-white shadow-elev",
            bal > 0 && "bg-gradient-to-br from-success to-success/70",
            bal < 0 && "bg-gradient-to-br from-destructive to-destructive/70",
            bal === 0 && "bg-gradient-to-br from-primary to-primary/70",
          )}
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
          <p className="text-xs font-medium uppercase tracking-wider opacity-90">
            {bal > 0 ? "They owe you" : bal < 0 ? "You owe them" : "All settled"}
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{formatINR(bal)}</p>
          <p className="mt-1 text-xs opacity-90">{txns.length} {txns.length === 1 ? "entry" : "entries"}</p>
        </div>
      </div>

      <div className="mt-5 px-5">
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Passbook</h2>
        </div>

        {txns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <Link
              to="/add"
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add first entry
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((g) => (
              <div key={g.key}>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </p>
                <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  {g.items.map((t, i) => (
                    <li
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5",
                        i !== 0 && "border-t border-border",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          t.type === "given" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {t.type === "given" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{t.category}</p>
                        {t.note && <p className="truncate text-xs text-muted-foreground">{t.note}</p>}
                        <p className="text-[10px] text-muted-foreground">{format(new Date(t.date), "h:mm a")}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-base font-bold tabular-nums", t.type === "given" ? "text-success" : "text-destructive")}>
                          {t.type === "given" ? "+" : "−"}{formatINR(t.amount)}
                        </p>
                        <button
                          onClick={() => {
                            actions.deleteTransaction(t.id);
                            toast.success("Entry deleted");
                          }}
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                        >
                          delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/add"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-fab"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function groupByDay<T extends { date: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = format(new Date(it.date), "yyyy-MM-dd");
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const d = new Date(items[0].date);
    const today = format(new Date(), "yyyy-MM-dd");
    const yest = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    const label = key === today ? "Today" : key === yest ? "Yesterday" : format(d, "d MMM yyyy");
    return { key, label, items };
  });
}
