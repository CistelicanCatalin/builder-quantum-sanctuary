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
} from "lucide-react";

export default function Index() {
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
                    <RefreshCcw className="mr-2" /> Bulk Update
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

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Connected Sites"
          value="12"
          icon={<Globe className="text-primary" />}
          trend="+2 this week"
        />
        <StatCard
          title="Pending Updates"
          value="27"
          icon={<RefreshCcw className="text-primary" />}
          alert
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
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updates</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Last Backup
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "alpha.dev",
                    theme: "Blocksy",
                    plugins: 12,
                    updates: 5,
                    backup: "2h ago",
                    status: "Healthy",
                  },
                  {
                    name: "shop.example.com",
                    theme: "Astra",
                    plugins: 28,
                    updates: 9,
                    backup: "1d ago",
                    status: "Updates",
                  },
                  {
                    name: "client-landing.io",
                    theme: "Kadence",
                    plugins: 8,
                    updates: 0,
                    backup: "3h ago",
                    status: "Healthy",
                  },
                ].map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Theme {s.theme} · {s.plugins} plugins
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.status === "Healthy" ? (
                        <Badge className="bg-emerald-500 text-white border-emerald-500">
                          <CheckCircle2 className="mr-1" /> Healthy
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white border-amber-500">
                          <AlertTriangle className="mr-1" /> Needs attention
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.updates > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {s.updates} available
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Up to date
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {s.backup}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                      >
                        <Link to="/sites">
                          Open <ChevronRight className="ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

function StatCard({
  title,
  value,
  icon,
  trend,
  alert,
  subtle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  alert?: boolean;
  subtle?: boolean;
}) {
  return (
    <Card className={subtle ? "border-amber-200/60" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="size-8 grid place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={"text-2xl font-bold " + (alert ? "text-amber-700" : "")}
        >
          {value}
        </div>
        {trend ? (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
