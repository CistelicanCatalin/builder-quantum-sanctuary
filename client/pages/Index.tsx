import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  RefreshCcw,
  Shield,
  Database,
  Globe,
  Plug2,
  Paintbrush,
  AlertTriangle,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { SitesStatsResponse, SiteItem, SitesListResponse, WpSiteStatusResponse, UptimeCheck } from "@shared/api";

export default function Index() {
  const [stats, setStats] = useState<SitesStatsResponse | null>(null);
  const [latestSites, setLatestSites] = useState<SiteItem[]>([]);
  const [statusById, setStatusById] = useState<Record<number, WpSiteStatusResponse | null>>({});
  const [uptimeStats, setUptimeStats] = useState<{total: number; up: number}>({ total: 0, up: 0 });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sites/stats");
        if (res.ok) {
          const data = (await res.json()) as SitesStatsResponse;
          setStats(data);
        }
      } catch {}
    })();
  }, []);
  // Load uptime stats
  useEffect(() => {
    (async () => {
      try {
        // Get all sites
        const sitesRes = await fetch("/api/sites");
        if (!sitesRes.ok) return;
        const sitesData = await sitesRes.json() as SitesListResponse;
        const sites = sitesData.items ?? [];

        // Get uptime checks for each site
        let total = 0;
        let up = 0;
        
        for (const site of sites) {
          const checksRes = await fetch("/api/uptime/site/" + site.id);
          if (!checksRes.ok) continue;
          const checksData = await checksRes.json();
          const checks = checksData.items as UptimeCheck[];
          
          // Only count active checks
          const activeChecks = checks.filter(c => c.is_active);
          total += activeChecks.length;
          up += activeChecks.filter(c => 
            c.last_status && c.last_status >= 200 && c.last_status < 300
          ).length;
        }
        
        setUptimeStats({ total, up });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sites");
        if (res.ok) {
          const data = (await res.json()) as SitesListResponse;
          setLatestSites((data.items ?? []).slice(0, 5));
        }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    if (latestSites.length === 0) return;
    (async () => {
      const entries = await Promise.all(
        latestSites.map(async (s) => {
          try {
            const r = await fetch(`/api/sites/${s.id}/status`);
            if (r.ok) {
              const d = (await r.json()) as WpSiteStatusResponse;
              return [s.id, d] as const;
            }
          } catch {}
          return [s.id, null] as const;
        }),
      );
      const map: Record<number, WpSiteStatusResponse | null> = {};
      for (const [id, d] of entries) map[id] = d;
      setStatusById(map);
    })();
  }, [latestSites]);
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
                  Manage all your WordPress sites in one place
                </h1>
                <p className="mt-1 text-muted-foreground max-w-2xl">
                  Updates, backups, security and performance monitoring across
                  your entire network. Fast. Safe. Centralized.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to="/sites">
                    <RefreshCcw className="mr-2" /> View all Sites
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/sites">
                    <Database className="mr-2" /> Add Site
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Connected Sites"
          value={stats ? String(stats.total) : "-"}
          icon={<Globe className="text-primary" />}
          trend={stats ? `+${stats.addedThisWeek} this week` : undefined}
        />
        <PendingUpdatesCard latestSites={latestSites} statusById={statusById} />
        <StatCard
          title="Site Status"
          value={uptimeStats.total > 0 ? `${uptimeStats.up}/${uptimeStats.total} up` : "-"}
          icon={<Activity className="text-primary" />}
          alert={uptimeStats.up < uptimeStats.total}
          link="/monitor"
        />
        <StatCard
          title="Security Alerts"
          value="1"
          icon={<Shield className="text-primary" />}
          alert
          subtle
        />
        <StatCard
          title="Last Backups"
          value="11/12 ok"
          icon={<Database className="text-primary" />}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Sites Overview</CardTitle>
            <Button variant="outline" asChild>
              <Link to="/sites">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>WP Version</TableHead>
                  <TableHead>Plugins</TableHead>
                  <TableHead>Updates</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestSites.map((s) => {
                  const st = statusById[s.id];
                  const plugins = st?.active_plugins;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.url}</div>
                      </TableCell>
                      <TableCell>{st ? st.wp_version : "-"}</TableCell>
                      <TableCell>
                        {plugins ? `${plugins.active_count}/${plugins.all_count}` : "-"}
                      </TableCell>
                      <TableCell>
                        {st?.active_plugins?.active?.filter(p => p.new_version && p.new_version !== p.version).length ?? 0}
                      </TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary"
                          onClick={async () => {
                            try {
                              const r = await fetch(`/api/sites/${s.id}/admin-login`, { method: "POST", headers: { "Content-Type": "application/json" } });
                              if (!r.ok) return;
                              const d = (await r.json()) as { url?: string };
                              if (d?.url) window.open(d.url, "_blank");
                            } catch {}
                          }}
                        >
                          Admin <ChevronRight className="ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {latestSites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No sites yet. Click "Add Site" to connect your first instance.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/sites">
                <Database className="mr-2" /> Connect New Site
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/sites">
                <RefreshCcw className="mr-2" /> Update All Plugins
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/sites">
                <Paintbrush className="mr-2" /> Manage Themes
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/sites">
                <Plug2 className="mr-2" /> Manage Plugins
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function PendingUpdatesCard({ latestSites, statusById }: { latestSites: SiteItem[]; statusById: Record<number, WpSiteStatusResponse | null>; }) {
  const total = latestSites.reduce((sum, s) => {
    const st = statusById[s.id];
    const count = st?.active_plugins?.active?.filter(p => p.new_version && p.new_version !== p.version).length ?? 0;
    return sum + count;
  }, 0);
  return (
    <StatCard
      title="Pending Updates"
      value={String(total)}
      icon={<RefreshCcw className="text-primary" />}
      alert={total > 0}
    />
  );
}
function StatCard({
  title,
  value,
  icon,
  trend,
  alert,
  subtle,
  link,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  alert?: boolean;
  subtle?: boolean;
  link?: string;
}) {
  const card = (
    <Card className={cn(
      "h-[140px]", // Increased height for all cards
      subtle ? "border-amber-200/60" : link ? "hover:border-primary/50 transition-colors cursor-pointer" : undefined
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="size-9 grid place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className={"text-3xl font-bold " + (alert ? "text-amber-700" : "")}
        >
          {value}
        </div>
        {trend ? (
          <p className="text-sm text-muted-foreground">{trend}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{card}</Link>;
  }

  return card;
}
