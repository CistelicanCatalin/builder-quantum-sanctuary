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
import type { SitesListResponse, SiteItem } from "@shared/api";

export default function Sites() {
  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sites");
        const data = (await res.json()) as SitesListResponse;
        setItems(data.items ?? []);
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
              <TableHead>Last seen</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(loading ? [] : items).map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.url}</TableCell>
                <TableCell>{s.last_seen ?? "-"}</TableCell>
                <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
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
