import AppShell from "@/components/layout/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SiteItem, UptimeCheck } from "@shared/api";
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

type MonitoredSite = {
  site: SiteItem;
  checks: (UptimeCheck & { history?: { uptime: number } })[];
};

export default function Monitor() {
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIds, setCheckingIds] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMonitoringData();
    // Refresh every minute
    const interval = setInterval(loadMonitoringData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function performCheck(checkId: number) {
    setCheckingIds(prev => [...prev, checkId]);
    try {
      const res = await fetch(`/api/uptime/${checkId}/check`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      await loadMonitoringData();
      toast({
        title: "Check completed",
        description: "Status updated successfully"
      });
    } catch (e: any) {
      toast({
        title: "Check failed",
        description: e?.message ?? "Failed to perform check",
        variant: "destructive"
      });
    } finally {
      setCheckingIds(prev => prev.filter(id => id !== checkId));
    }
  }

  async function loadMonitoringData() {
    try {
      // Load sites first
      const sitesRes = await fetch("/api/sites");
      if (!sitesRes.ok) throw new Error("HTTP " + sitesRes.status);
      const sitesData = await sitesRes.json();
      
      // Then load checks for each site
      const monitoredSites = await Promise.all(
        (sitesData.items as SiteItem[]).map(async (site) => {
          const checksRes = await fetch("/api/uptime/site/" + site.id);
          if (!checksRes.ok) return { site, checks: [] };
          const checksData = await checksRes.json();
          
          // Load last 24h history for each check to calculate uptime
          const checksWithHistory = await Promise.all(
            checksData.items.map(async (check: UptimeCheck) => {
              try {
                const historyRes = await fetch("/api/uptime/" + check.id + "/history?limit=100");
                if (!historyRes.ok) return check;
                const historyData = await historyRes.json();
                
                // Calculate uptime percentage from history
                const history = historyData.items ?? [];
                const successfulChecks = history.filter(
                  (h: any) => h.status_code >= 200 && h.status_code < 300
                ).length;
                const uptime = history.length > 0 
                  ? (successfulChecks / history.length) * 100 
                  : 0;
                
                return { ...check, history: { uptime } };
              } catch {
                return check;
              }
            })
          );
          
          return {
            site,
            checks: checksWithHistory,
          };
        })
      );
      
      setSites(monitoredSites.filter(s => s.checks.length > 0));
    } catch (e: any) {
      toast({
        title: "Failed to load monitoring data",
        description: e?.message ?? "Request failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-[200px] bg-muted rounded-lg"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Uptime Monitor</h1>
          <p className="text-muted-foreground">
            Monitor the availability and performance of your sites
          </p>
        </div>

        {sites.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No monitored sites</CardTitle>
              <CardDescription>
                Add uptime checks to your sites to start monitoring their availability.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sites.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Monitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sites.reduce((acc, site) => 
                      acc + site.checks.filter(c => c.is_active).length, 0
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sites Up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {sites.filter(site => 
                      site.checks.some(c => 
                        c.last_status && c.last_status >= 200 && c.last_status < 300
                      )
                    ).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sites Down
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {sites.filter(site => 
                      site.checks.every(c => 
                        !c.last_status || c.last_status < 200 || c.last_status >= 300
                      )
                    ).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sites Table */}
            <Card>
              <CardHeader>
                <CardTitle>Monitored Sites</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Check</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>24h Uptime</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map(({ site, checks }) => (
                      checks.map(check => (
                        <TableRow key={check.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{site.url}</div>
                              <div className="text-sm text-muted-foreground">{check.url}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {!check.last_status ? (
                              <div className="flex items-center text-destructive">
                                <XCircle className="w-4 h-4 mr-1" />
                                Down
                              </div>
                            ) : check.last_status >= 200 && check.last_status < 300 ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Up
                              </div>
                            ) : (
                              <div className="flex items-center text-yellow-600">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Warning
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {check.last_check ? (
                              new Date(check.last_check).toLocaleString()
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {check.response_time ? (
                              <>
                                <span className={
                                  check.response_time < 500 ? "text-green-600" :
                                  check.response_time < 1000 ? "text-yellow-600" :
                                  "text-destructive"
                                }>
                                  {check.response_time}ms
                                </span>
                              </>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {check.history ? (
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={check.history.uptime}
                                  className="w-[60px]"
                                />
                                <span className={
                                  check.history.uptime >= 99 ? "text-green-600" :
                                  check.history.uptime >= 95 ? "text-yellow-600" :
                                  "text-destructive"
                                }>
                                  {check.history.uptime.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => performCheck(check.id)}
                              disabled={checkingIds.includes(check.id)}
                            >
                              {checkingIds.includes(check.id) ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Checking...
                                </>
                              ) : (
                                "Check Now"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
