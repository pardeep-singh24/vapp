import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Bell, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ReminderDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  title = "Set reminder",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: string;
  onSave: (iso: string | null) => void;
  title?: string;
}) {
  const [date, setDate] = useState<Date>(initial ? new Date(initial) : new Date());
  const [time, setTime] = useState<string>(
    format(initial ? new Date(initial) : new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
  );

  useEffect(() => {
    if (open) {
      setDate(initial ? new Date(initial) : new Date());
      setTime(format(initial ? new Date(initial) : new Date(Date.now() + 60 * 60 * 1000), "HH:mm"));
    }
  }, [open, initial]);

  function save() {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h || 0, m || 0, 0, 0);
    onSave(d.toISOString());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 w-full justify-start rounded-xl font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "EEE, d MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rtime">Time</Label>
            <Input id="rtime" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          {initial && (
            <Button variant="ghost" className="rounded-full text-destructive" onClick={() => { onSave(null); onOpenChange(false); }}>
              Clear
            </Button>
          )}
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
