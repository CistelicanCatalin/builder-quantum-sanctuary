import AppShell from "@/components/layout/AppShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddSiteDialog from "@/components/sites/AddSiteDialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { SitesListResponse, SiteItem, WpSiteStatusResponse } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export default function Sites() {
  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusById, setStatusById] = useState<Record<number, WpSiteStatusResponse | null>>({});
  const [openRow, setOpenRow] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sites");
        const data = (await res.json()) as SitesListResponse;
        const list = data.items ?? [];
        setItems(list);
        // Fetch statuses in parallel
        const entries = await Promise.all(
          list.map(async (s) => {
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Sites</h1>
        <AddSiteDialog />
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>WP Version</TableHead>
              <TableHead>Plugins</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(loading ? [] : items).map((s) => {
              const st = statusById[s.id];
              const plugins = st?.active_plugins;
              return (
                <>
                <TableRow key={s.id}>
                  <TableCell>{s.url}</TableCell>
                  <TableCell>{st ? st.wp_version : "-"}</TableCell>
                  <TableCell>{plugins ? `${plugins.active_count}/${plugins.all_count}` : "-"}</TableCell>
                  <TableCell>{s.last_seen ?? "-"}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setOpenRow(openRow === s.id ? null : s.id)}>
                        {openRow === s.id ? <ChevronDown className="mr-1" /> : <ChevronRight className="mr-1" />} Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const r = await fetch(`/api/sites/${s.id}/admin-login`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                            });
                            if (!r.ok) throw new Error(`HTTP ${r.status}`);
                            const d = (await r.json()) as { url?: string };
                            if (d?.url) {
                              window.open(d.url, "_blank");
                              toast({ title: "Admin login", description: "Opened secure admin session." });
                            } else {
                              toast({ title: "Admin login failed", description: "No URL returned.", variant: "destructive" as any });
                            }
                          } catch (e: any) {
                            toast({ title: "Admin login failed", description: e?.message ?? "Request error", variant: "destructive" as any });
                          }
                        }}
                      >
                        Admin <ExternalLink className="ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = await toggleMaintenance(s.id, true);
                          toast({ title: ok ? "Maintenance enabled" : "Failed to enable", variant: ok ? undefined : ("destructive" as any) });
                        }}
                      >
                        Enable Maintenance
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = await toggleMaintenance(s.id, false);
                          toast({ title: ok ? "Maintenance disabled" : "Failed to disable", variant: ok ? undefined : ("destructive" as any) });
                        }}
                      >
                        Disable Maintenance
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => changePlugin(s.id, "activate")}>
                        Activate Plugin
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => changePlugin(s.id, "deactivate")}>
                        Deactivate Plugin
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {openRow === s.id ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="text-sm">
                        <div className="font-medium mb-2">Active plugins</div>
                        <div className="mb-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const file = window.prompt("Enter plugin file to activate (e.g. akismet/akismet.php)");
                              if (!file) return;
                              const ok = await changePlugin(s.id, "activate", file);
                              if (ok) {
                                await refreshStatus(s.id, setStatusById);
                                toast({ title: "Plugin activated", description: file });
                              } else {
                                toast({ title: "Activation failed", description: file, variant: "destructive" as any });
                              }
                            }}
                          >
                            Activate by file
                          </Button>
                        </div>
                        <ul className="pl-0 space-y-1">
                          {st?.active_plugins?.active?.length ? (
                            st.active_plugins.active.map((p) => (
                              <li key={p.file} className="flex items-center justify-between gap-2">
                                <div>
                                  {p.name}
                                  <span className="text-muted-foreground"> (v{p.version}{p.new_version && p.new_version !== p.version ? ` → v${p.new_version}` : ''})</span>
                                </div>
                                <div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      const ok = await changePlugin(s.id, "deactivate", p.file);
                                      if (ok) {
                                        await refreshStatus(s.id, setStatusById);
                                        toast({ title: "Plugin deactivated", description: p.file });
                                      } else {
                                        toast({ title: "Deactivation failed", description: p.file, variant: "destructive" as any });
                                      }
                                    }}
                                  >
                                    Disable
                                  </Button>
                                  {p.new_version && p.new_version !== p.version ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="ml-2"
                                      onClick={async () => {
                                        const ok = await updatePlugin(s.id, p.file);
                                        if (ok) {
                                          await refreshStatus(s.id, setStatusById);
                                          toast({ title: "Plugin updated", description: `${p.name} to v${p.new_version}` });
                                        } else {
                                          toast({ title: "Update failed", description: p.file, variant: "destructive" as any });
                                        }
                                      }}
                                    >
                                      Update
                                    </Button>
                                  ) : null}
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">No data</li>
                          )}
                        </ul>

                        <div className="font-medium mt-4 mb-2">Inactive plugins</div>
                        <ul className="pl-0 space-y-1">
                          {st?.active_plugins?.inactive?.length ? (
                            st.active_plugins.inactive.map((p) => (
                              <li key={p.file} className="flex items-center justify-between gap-2">
                                <div>
                                  {p.name}
                                  <span className="text-muted-foreground"> (v{p.version || '-'}{p.new_version && p.new_version !== p.version ? ` → v${p.new_version}` : ''})</span>
                                </div>
                                <div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      const ok = await changePlugin(s.id, "activate", p.file);
                                      if (ok) {
                                        await refreshStatus(s.id, setStatusById);
                                        toast({ title: "Plugin activated", description: p.file });
                                      } else {
                                        toast({ title: "Activation failed", description: p.file, variant: "destructive" as any });
                                      }
                                    }}
                                  >
                                    Enable
                                  </Button>
                                  {p.new_version && p.new_version !== p.version ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="ml-2"
                                      onClick={async () => {
                                        const ok = await updatePlugin(s.id, p.file);
                                        if (ok) {
                                          await refreshStatus(s.id, setStatusById);
                                          toast({ title: "Plugin updated", description: `${p.name} to v${p.new_version}` });
                                        } else {
                                          toast({ title: "Update failed", description: p.file, variant: "destructive" as any });
                                        }
                                      }}
                                    >
                                      Update
                                    </Button>
                                  ) : null}
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">No data</li>
                          )}
                        </ul>

                        <div className="font-medium mt-4">Maintenance</div>
                        <div className="text-muted-foreground mb-2">Current: {st?.maintenance ? 'ON' : 'OFF'}</div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const ok = await toggleMaintenance(s.id, true);
                              if (ok) { await refreshStatus(s.id, setStatusById); toast({ title: "Maintenance enabled" }); }
                              else { toast({ title: "Failed to enable maintenance", variant: "destructive" as any }); }
                            }}
                          >
                            Enable
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const ok = await toggleMaintenance(s.id, false);
                              if (ok) { await refreshStatus(s.id, setStatusById); toast({ title: "Maintenance disabled" }); }
                              else { toast({ title: "Failed to disable maintenance", variant: "destructive" as any }); }
                            }}
                          >
                            Disable
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
                </>
              );
            })}
            {!loading && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No sites yet. Click "Add Site" to connect your first instance.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

async function toggleMaintenance(siteId: number, enable: boolean) {
  try {
    await fetch(`/api/sites/${siteId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enable }),
    });
    return true;
  } catch {}
  return false;
}

async function changePlugin(siteId: number, action: "activate" | "deactivate", file?: string) {
  if (!file) return false;
  try {
    await fetch(`/api/sites/${siteId}/plugins/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file }),
    });
    return true;
  } catch {}
  return false;
}

async function updatePlugin(siteId: number, file: string) {
  if (!file) return false;
  try {
    const r = await fetch(`/api/sites/${siteId}/plugins/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file }),
    });
    return r.ok;
  } catch {}
  return false;
}

async function adminLogin(siteId: number) {
  try {
    const r = await fetch(`/api/sites/${siteId}/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (r.ok) {
      const d = (await r.json()) as { url?: string };
      if (d?.url) window.open(d.url, "_blank");
      return true;
    }
  } catch {}
  return false;
}

async function refreshStatus(
  siteId: number,
  setStatus: React.Dispatch<React.SetStateAction<Record<number, WpSiteStatusResponse | null>>>,
) {
  try {
    const r = await fetch(`/api/sites/${siteId}/status`);
    if (r.ok) {
      const d = (await r.json()) as WpSiteStatusResponse;
      setStatus((prev) => ({ ...prev, [siteId]: d }));
    }
  } catch {}
}
