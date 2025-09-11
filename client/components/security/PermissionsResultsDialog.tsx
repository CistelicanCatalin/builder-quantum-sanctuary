import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface FilePermission {
  file: string;
  currentPermissions: string;
  recommended: string;
  status: "ok" | "warning" | "error";
  lastModified: string;
  created: string;
}

interface PermissionsResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: {
    status: string;
    permissions: FilePermission[];
  } | null;
}

export default function PermissionsResultsDialog({ open, onOpenChange, results }: PermissionsResultsProps) {
  if (!results) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>Rezultate Verificare Permisiuni Fișiere</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.permissions.map((perm, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">{perm.file}</TableCell>
                  <TableCell className="font-mono">{perm.currentPermissions}</TableCell>
                  <TableCell className="font-mono">{perm.recommended}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(perm.created).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(perm.lastModified).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={perm.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "ok":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 inline-flex items-center">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          OK
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 inline-flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Warning
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 inline-flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return null;
  }
}