import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { UptimeCheck } from "@shared/api";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type HistoryItem = {
  id: number;
  check_id: number;
  status_code: number | null;
  response_time: number | null;
  checked_at: string;
};

export default function UptimeMonitor({ siteId, siteUrl }: { siteId: number; siteUrl: string }): JSX.Element {
  const [checks, setChecks] = useState<UptimeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [history, setHistory] = useState<Record<number, HistoryItem[]>>({});
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);
  const { toast } = useToast();

  // Load uptime checks
  useEffect(() => {
    loadChecks();
  }, [siteId]);

  async function loadChecks() {
    try {
      const res = await fetch(`/api/uptime/site/${siteId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChecks(data.items ?? []);
    } catch (e: any) {
      toast({
        title: "Failed to load uptime checks",
        description: e?.message ?? "Request failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(checkId: number) {
    try {
      const res = await fetch(`/api/uptime/${checkId}/history?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(prev => ({ ...prev, [checkId]: data.items }));
    } catch (e: any) {
      toast({
        title: "Failed to load check history",
        description: e?.message ?? "Request failed",
        variant: "destructive",
      });
    }
  }

  async function handleAddCheck(url: string, interval: number) {
    try {
      const res = await fetch("/api/uptime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId, url, check_interval: interval }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadChecks();
      setOpenDialog(false);
      toast({
        title: "Uptime check added",
        description: `Monitoring ${url}`,
      });
    } catch (e: any) {
      toast({
        title: "Failed to add check",
        description: e?.message ?? "Request failed",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateCheck(checkId: number, data: { is_active?: boolean; check_interval?: number }) {
    try {
      const res = await fetch(`/api/uptime/${checkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadChecks();
      toast({
        title: "Check updated",
        description: "Settings saved successfully",
      });
    } catch (e: any) {
      toast({
        title: "Failed to update check",
        description: e?.message ?? "Request failed",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCheck(checkId: number) {
    if (!confirm("Are you sure you want to delete this uptime check?")) return;
    
    try {
      const res = await fetch(`/api/uptime/${checkId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadChecks();
      toast({
        title: "Check deleted",
        description: "Monitor removed successfully",
      });
    } catch (e: any) {
      toast({
        title: "Failed to delete check",
        description: e?.message ?? "Request failed",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Uptime Monitoring</h3>
        <AddUptimeCheckDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          siteUrl={siteUrl}
          onAdd={handleAddCheck}
        />
      </div>

      {checks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No uptime checks configured</CardTitle>
            <CardDescription>
              Add your first uptime check to start monitoring your site's availability.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {checks.map(check => (
            <Card key={check.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">{check.url}</CardTitle>
                    <CardDescription>
                      Checks every {check.check_interval} seconds
                      {check.last_check && ` • Last checked: ${new Date(check.last_check).toLocaleString()}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={check.is_active}
                      onCheckedChange={(active) => handleUpdateCheck(check.id, { is_active: active })}
                    />
                    <Select
                      value={String(check.check_interval)}
                      onValueChange={(v) => handleUpdateCheck(check.id, { check_interval: parseInt(v, 10) })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Check interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Check Interval</SelectLabel>
                          <SelectItem value="60">Every minute</SelectItem>
                          <SelectItem value="300">Every 5 minutes</SelectItem>
                          <SelectItem value="900">Every 15 minutes</SelectItem>
                          <SelectItem value="1800">Every 30 minutes</SelectItem>
                          <SelectItem value="3600">Every hour</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (openHistoryId === check.id) {
                          setOpenHistoryId(null);
                        } else {
                          setOpenHistoryId(check.id);
                          loadHistory(check.id);
                        }
                      }}
                    >
                      {openHistoryId === check.id ? <ChevronDown /> : <ChevronRight />} History
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCheck(check.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {openHistoryId === check.id && (
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Response Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history[check.id]?.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.checked_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={
                                !item.status_code ? "text-destructive" :
                                item.status_code >= 200 && item.status_code < 300 ? "text-green-600" :
                                "text-yellow-600"
                              }>
                                {item.status_code ?? "Failed"}
                              </span>
                            </TableCell>
                            <TableCell>{item.response_time ? `${item.response_time}ms` : "-"}</TableCell>
                          </TableRow>
                        ))}
                        {(!history[check.id] || history[check.id].length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              No history yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddUptimeCheckDialog({
  open,
  onOpenChange,
  siteUrl,
  onAdd
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteUrl: string;
  onAdd: (url: string, interval: number) => void;
}) {
  const [url, setUrl] = useState(siteUrl);
  const [interval, setInterval] = useState(300);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Check</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Uptime Check</DialogTitle>
          <DialogDescription>
            Add a new URL to monitor. The system will check this URL periodically and record its status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL to monitor</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Check interval</label>
            <Select
              value={String(interval)}
              onValueChange={(v) => setInterval(parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Check Interval</SelectLabel>
                  <SelectItem value="60">Every minute</SelectItem>
                  <SelectItem value="300">Every 5 minutes</SelectItem>
                  <SelectItem value="900">Every 15 minutes</SelectItem>
                  <SelectItem value="1800">Every 30 minutes</SelectItem>
                  <SelectItem value="3600">Every hour</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onAdd(url, interval)}>
            Add Monitor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
