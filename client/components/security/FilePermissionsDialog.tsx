import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileWarning } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import PermissionsResultsDialog from "./PermissionsResultsDialog";

interface Site {
  id: number;
  url: string;
  last_seen: string | null;
  created_at: string;
}

interface FilePermission {
  file: string;
  currentPermissions: string;
  recommended: string;
  status: "ok" | "warning" | "error";
  lastModified: string;
  created: string;
}

interface PermissionsResponse {
  status: string;
  permissions: FilePermission[];
}

export default function FilePermissionsDialog({ trigger }: { trigger: React.ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PermissionsResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const { data: sites, isLoading, error } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await fetch("/api/sites");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      // The API might return { items: [...] } or just [...]
      return data.items || data;
    }
  });

  const handleCheck = async () => {
    try {
      const response = await fetch("/api/security/check-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteId: selectedSite }),
      });

      if (!response.ok) {
        throw new Error("Failed to check permissions");
      }

      const data = await response.json();
      setResults(data);
      setOpen(false);
      setShowResults(true);
    } catch (error) {
      console.error("Error checking permissions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check file permissions. Please try again."
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" />
              Check File Permissions
            </DialogTitle>
            <DialogDescription>
              Select a site to check its file permissions for potential security issues.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sites...</p>
              ) : error ? (
                <p className="text-sm text-destructive">Error loading sites</p>
              ) : (
                <Select
                  value={selectedSite}
                  onValueChange={setSelectedSite}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheck}
              disabled={!selectedSite}
            >
              Check Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PermissionsResultsDialog 
        open={showResults} 
        onOpenChange={setShowResults}
        results={results}
      />
    </>
  );
}