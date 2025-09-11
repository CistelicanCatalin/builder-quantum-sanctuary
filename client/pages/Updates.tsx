import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import type { SiteItem, WpSiteStatusResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Updates() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [statusById, setStatusById] = useState<Record<number, WpSiteStatusResponse | null>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sites");
        const data = await res.json();
        const list = data.items ?? [];
        setSites(list);
        
        // Fetch statuses in parallel
        const entries = await Promise.all(
          list.map(async (s) => {
            try {
              const r = await fetch(`/api/sites/${s.id}/status`);
              if (r.ok) {
                const d = await r.json();
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

  // Filter sites that need updates
  const sitesNeedingUpdates = sites.filter(site => {
    const status = statusById[site.id];
    if (!status?.active_plugins) return false;
    
    return status.active_plugins.active.some(p => p.new_version) || 
           status.active_plugins.inactive?.some(p => p.new_version);
  });

  if (loading) {
    return (
      <AppShell>
        <div>Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">Updates Available</h1>
        </div>

        {sitesNeedingUpdates.length === 0 ? (
          <div className="text-muted-foreground">All plugins are up to date!</div>
        ) : (
          <div className="space-y-8">
            {sitesNeedingUpdates.map(site => {
              const status = statusById[site.id];
              if (!status) return null;

              const pluginsNeedingUpdates = [
                ...(status.active_plugins.active || []),
                ...(status.active_plugins.inactive || [])
              ].filter(p => p.new_version);

              return (
                <div key={site.id} className="border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">{site.url}</h2>
                  <div className="space-y-4">
                    {pluginsNeedingUpdates.map(plugin => (
                      <div key={plugin.file} className="flex items-center justify-between gap-4 border-b pb-4">
                        <div>
                          <div className="font-medium">{plugin.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Current: v{plugin.version} → Available: v{plugin.new_version}
                          </div>
                        </div>
                        <Button
                          onClick={async () => {
                            const ok = await updatePlugin(site.id, plugin.file);
                            if (ok) {
                              // Refresh status after update
                              const r = await fetch(`/api/sites/${site.id}/status`);
                              if (r.ok) {
                                const newStatus = await r.json();
                                setStatusById(prev => ({ ...prev, [site.id]: newStatus }));
                              }
                              toast({ 
                                title: "Plugin updated", 
                                description: `${plugin.name} updated to v${plugin.new_version}` 
                              });
                            } else {
                              toast({ 
                                title: "Update failed", 
                                description: plugin.file,
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
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
  } catch {
    return false;
  }
}
