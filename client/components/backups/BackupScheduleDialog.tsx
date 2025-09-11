import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const scheduleFormSchema = z.object({
  siteId: z.number().min(1, "Please select a website"),
  type: z.enum(["full", "database", "files"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  retentionDays: z.number().min(1).max(365),
});

interface BackupSchedule {
  id: number;
  site_id: number;
  type: "full" | "database" | "files";
  frequency: "daily" | "weekly" | "monthly";
  time_of_day: string;
  day_of_week: number | null;
  day_of_month: number | null;
  retention_days: number;
  is_active: boolean;
}

interface BackupScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId?: number;
  schedule?: BackupSchedule;
  onScheduleCreated: () => void;
  onScheduleUpdated?: () => void;
}

interface Site {
  id: number;
  url: string;
}

export default function BackupScheduleDialog({ 
  open, 
  onOpenChange, 
  siteId, 
  schedule, 
  onScheduleCreated,
  onScheduleUpdated 
}: BackupScheduleDialogProps) {
  const { data: sites } = useQuery<{ items: Site[] }>({
    queryKey: ['sites'],
    queryFn: () => fetch('/api/sites').then(res => res.json())
  });

  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      siteId: schedule?.site_id || siteId || undefined,
      type: schedule?.type || "full",
      frequency: schedule?.frequency || "daily",
      timeOfDay: schedule?.time_of_day || "00:00",
      dayOfWeek: schedule?.day_of_week || undefined,
      dayOfMonth: schedule?.day_of_month || undefined,
      retentionDays: schedule?.retention_days || 30,
    },
  });

  const onSubmit = async (data: z.infer<typeof scheduleFormSchema>) => {
    try {
      const payload = {
        site_id: data.siteId,
        type: data.type,
        frequency: data.frequency,
        time_of_day: data.timeOfDay,
        day_of_week: data.frequency === "weekly" ? data.dayOfWeek : null,
        day_of_month: data.frequency === "monthly" ? data.dayOfMonth : null,
        retention_days: data.retentionDays,
        is_active: true
      };

      const response = await fetch(
        schedule ? `/api/backups/schedule/${schedule.id}` : "/api/backups/schedule",
        {
          method: schedule ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        onOpenChange(false);
        if (schedule) {
          onScheduleUpdated?.();
        } else {
          onScheduleCreated();
        }
        form.reset();
      }
    } catch (error) {
      console.error(
        `Failed to ${schedule ? "update" : "create"} backup schedule:`,
        error
      );
    }
  };

  const frequency = form.watch("frequency");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Add Schedule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Backup Schedule" : "Create Backup Schedule"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select website" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites?.items.map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.url}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backup Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full">Full Backup</SelectItem>
                      <SelectItem value="database">Database Only</SelectItem>
                      <SelectItem value="files">Files Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {frequency === "weekly" && (
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {frequency === "monthly" && (
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Month</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Day {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="timeOfDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retentionDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retention Period (days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Schedule</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
