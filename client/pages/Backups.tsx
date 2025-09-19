import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Clock,
  HardDrive
} from "lucide-react";
import { formatDistance } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import BackupScheduleDialog from "@/components/backups/BackupScheduleDialog";
import CreateBackupDialog from "@/components/backups/CreateBackupDialog";

interface Backup {
  id: number;
  site_id: number;
  site_url?: string;
  type: "full" | "database" | "files";
  status: "pending" | "in_progress" | "completed" | "failed";
  error_message: string | null;
  size_bytes: number;
  created_at: string;
  completed_at: string | null;
  retention_days: number;
  is_manual: boolean;
  download_url: string | null;
}

interface BackupSchedule {
  id: number;
  site_id: number;
  site_url?: string;
  type: "full" | "database" | "files";
  frequency: "daily" | "weekly" | "monthly";
  time_of_day: string;
  day_of_week: number | null;
  day_of_month: number | null;
  retention_days: number;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
}

export default function BackupsPage() {
  const { siteId } = useParams<{ siteId?: string }>();
  console.log('BackupsPage rendered with siteId:', siteId);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<BackupSchedule | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialData = async () => {
      console.log("Loading initial data, siteId:", siteId);
      try {
        await Promise.all([fetchBackups(), fetchSchedules()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [siteId]);

  const fetchBackups = async (retryCount = 0) => {
    try {
      console.log("Fetching backups, siteId:", siteId);
      setLoading(true);
      const url = siteId ? `/api/backups/site/${siteId}` : '/api/backups';
      console.log("Fetching from URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Server response not OK:", response.status, response.statusText);
        throw new Error(`Failed to fetch backups: ${response.status}`);
      }
      const data = await response.json();
      console.log("Received backups:", data);
      setBackups(data.items || []);
      setError(null);

      // Verifică backup-uri în progres și reîncearcă
      const hasInProgress = (data.items || []).some(
        (b: Backup) => b.status === "pending" || b.status === "in_progress"
      );
      if (hasInProgress && retryCount < 30) {
        setTimeout(() => fetchBackups(retryCount + 1), 10000);
      }

      // Notificări pentru backup finalizat sau eșuat
      (data.items || []).forEach((backup: Backup) => {
        if (backup.status === "completed" && backup.download_url) {
          toast({
            title: "Backup completed",
            description: `${backup.type} backup is ready for download`,
          });
        } else if (backup.status === "failed") {
          toast({
            title: "Backup failed",
            description: backup.error_message || "An error occurred during backup",
            variant: "destructive",
          });
        }
      });
    } catch (err) {
      console.error("Failed to fetch backups:", err);
      setError("Failed to load backups");
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const fetchSchedules = async () => {
    try {
      const url = siteId ? `/api/backups/schedule/site/${siteId}` : '/api/backups/schedule';
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch schedules");
      const data = await response.json();
      setSchedules(data.items || []);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    }
  };

  const createBackup = async (type: string) => {
    try {
      const response = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: Number(siteId),
          type,
          retention_days: 30,
        }),
      });

      if (response.ok) {
        fetchBackups();
      }
    } catch (err) {
      console.error("Failed to create backup:", err);
    }
  };

  const deleteBackup = async (backupId: number) => {
    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBackups();
      }
    } catch (err) {
      console.error("Failed to delete backup:", err);
    }
  };

  const deleteSchedule = async (scheduleId: number) => {
    try {
      const response = await fetch(`/api/backups/schedule/${scheduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const runSchedule = async (scheduleId: number) => {
    try {
      const response = await fetch(`/api/backups/schedule/${scheduleId}/run`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Backup Started",
          description: "The backup has been initiated and will be available shortly.",
        });
        fetchBackups();
        fetchSchedules();
      } else {
        throw new Error("Failed to run backup schedule");
      }
    } catch (err) {
      console.error("Failed to run backup schedule:", err);
      toast({
        title: "Error",
        description: "Failed to start the backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AppShell>
      <div className="mb-6">
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-accent/10 to-transparent">
          <div className="absolute -right-24 -top-24 size-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 size-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Backup Management
                </h1>
                <p className="mt-1 text-muted-foreground max-w-2xl">
                  Keep your WordPress sites safe with automated backups. Schedule regular backups and restore when needed.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setCreateOpen(true)}>Create Backup</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(backups.reduce((acc, b) => acc + (b.size_bytes || 0), 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.length > 0 && schedules[0].next_run
                ? formatDistance(new Date(schedules[0].next_run), new Date(), { addSuffix: true })
                : "Not scheduled"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center p-4 text-red-600">{error}</div>
          ) : loading ? (
            <div className="text-center p-4">Loading backups...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!siteId && <TableHead>Site</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    {!siteId && (
                      <TableCell>
                        <a href={`/backups/${backup.site_id}`} className="text-blue-600 hover:underline">
                          {backup.site_url || `Site ${backup.site_id}`}
                        </a>
                      </TableCell>
                    )}
                    <TableCell>{backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}</TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          backup.status === "completed" && "bg-green-100 text-green-700",
                          backup.status === "failed" && "bg-red-100 text-red-700",
                          backup.status === "in_progress" && "bg-blue-100 text-blue-700",
                          backup.status === "pending" && "bg-yellow-100 text-yellow-700"
                        )}
                      >
                        {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(backup.created_at), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell>{formatBytes(backup.size_bytes)}</TableCell>
                    <TableCell>{backup.retention_days} days</TableCell>
                    <TableCell className="text-right space-x-2">
                      {backup.download_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={backup.download_url} download>
                            Download
                          </a>
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteBackup(backup.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Backup Schedule</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
            Add Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {!siteId && <TableHead>Website</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  {!siteId && (
                    <TableCell>
                      <a 
                        href={`/backups/${schedule.site_id}`} 
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {schedule.site_url || `Site ${schedule.site_id}`}
                      </a>
                    </TableCell>
                  )}
                  <TableCell>{schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}</TableCell>
                  <TableCell>
                    {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                    {schedule.frequency === "weekly" && schedule.day_of_week !== null &&
                      ` (${new Date(2021, 0, 3 + schedule.day_of_week).toLocaleDateString('en-US', { weekday: 'long' })})`}
                    {schedule.frequency === "monthly" && schedule.day_of_month !== null &&
                      ` (Day ${schedule.day_of_month})`}
                    {` at ${schedule.time_of_day}`}
                  </TableCell>
                  <TableCell>
                    {schedule.next_run
                      ? formatDistance(new Date(schedule.next_run), new Date(), { addSuffix: true })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {schedule.last_run
                      ? formatDistance(new Date(schedule.last_run), new Date(), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      schedule.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {schedule.is_active ? "Active" : "Inactive"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => runSchedule(schedule.id)}
                    >
                      Run Now
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setScheduleOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BackupScheduleDialog
        open={scheduleOpen}
        onOpenChange={(open) => {
          setScheduleOpen(open);
          if (!open) {
            setSelectedSchedule(undefined);
          }
        }}
        siteId={Number(siteId)}
        schedule={selectedSchedule}
        onScheduleCreated={() => {
          setScheduleOpen(false);
          fetchSchedules();
        }}
        onScheduleUpdated={() => {
          setScheduleOpen(false);
          setSelectedSchedule(undefined);
          fetchSchedules();
        }}
      />

      <CreateBackupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onBackupCreated={() => {
          setCreateOpen(false);
          fetchBackups();
        }}
      />
    </AppShell>
  );
}
