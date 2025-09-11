import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldAlert, Lock, UnlockKeyhole, RefreshCw } from "lucide-react";

interface SecurityIssue {
  id: number;
  site_id: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
  status: "open" | "resolved";
  detected_at: string;
  resolved_at: string | null;
}

interface SecurityScan {
  id: number;
  site_id: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  issues_found: number;
  started_at: string;
  completed_at: string | null;
}

export default function SecurityTools() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<SecurityScan | null>(null);
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const { toast } = useToast();

  const startScan = async () => {
    try {
      setScanning(true);
      const response = await fetch("/api/security/scan", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to start security scan");

      const scan = await response.json();
      setLastScan(scan);

      toast({
        title: "Security Scan Started",
        description: "The security scan has been initiated and will check for vulnerabilities.",
      });

      // Poll for scan completion
      pollScanStatus(scan.id);
    } catch (error) {
      console.error("Failed to start security scan:", error);
      toast({
        title: "Error",
        description: "Failed to start security scan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pollScanStatus = async (scanId: number) => {
    try {
      const response = await fetch(`/api/security/scan/${scanId}`);
      if (!response.ok) throw new Error("Failed to fetch scan status");

      const scan = await response.json();
      setLastScan(scan);

      if (scan.status === "completed" || scan.status === "failed") {
        setScanning(false);
        if (scan.status === "completed") {
          fetchSecurityIssues();
          toast({
            title: "Security Scan Completed",
            description: `Found ${scan.issues_found} potential security issues.`,
          });
        } else {
          toast({
            title: "Security Scan Failed",
            description: "The security scan encountered an error. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Continue polling if scan is still in progress
        setTimeout(() => pollScanStatus(scanId), 5000);
      }
    } catch (error) {
      console.error("Failed to check scan status:", error);
      setScanning(false);
    }
  };

  const fetchSecurityIssues = async () => {
    try {
      const response = await fetch("/api/security/issues");
      if (!response.ok) throw new Error("Failed to fetch security issues");

      const { items } = await response.json();
      setSecurityIssues(items);
    } catch (error) {
      console.error("Failed to fetch security issues:", error);
    }
  };

  const resolveIssue = async (issueId: number) => {
    try {
      const response = await fetch(`/api/security/issues/${issueId}/resolve`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to resolve security issue");

      toast({
        title: "Issue Resolved",
        description: "The security issue has been marked as resolved.",
      });

      fetchSecurityIssues();
    } catch (error) {
      console.error("Failed to resolve security issue:", error);
      toast({
        title: "Error",
        description: "Failed to resolve the security issue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-700 bg-red-100";
      case "high":
        return "text-orange-700 bg-orange-100";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      case "low":
        return "text-green-700 bg-green-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </CardTitle>
            <CardDescription>
              Monitor and manage security vulnerabilities across your WordPress sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={startScan} 
                disabled={scanning}
                className="w-full"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Start Security Scan
                  </>
                )}
              </Button>

              {lastScan && lastScan.completed_at && (
                <Alert>
                  <AlertTitle>Last Scan Results</AlertTitle>
                  <AlertDescription>
                    Scan completed {new Date(lastScan.completed_at).toLocaleString()}.
                    Found {lastScan.issues_found} potential security issues.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common security actions and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button variant="outline" className="justify-start">
                <UnlockKeyhole className="mr-2 h-4 w-4" />
                Reset All Admin Passwords
              </Button>
              <Button variant="outline" className="justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="justify-start">
                <Lock className="mr-2 h-4 w-4" />
                Update Security Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Issues</CardTitle>
          <CardDescription>
            Active security issues detected across your sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>{issue.type}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(
                        issue.severity
                      )}`}
                    >
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{issue.description}</TableCell>
                  <TableCell>{issue.recommendation}</TableCell>
                  <TableCell>
                    {new Date(issue.detected_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveIssue(issue.id)}
                    >
                      Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {securityIssues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No security issues found. Run a security scan to check for vulnerabilities.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}