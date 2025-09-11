import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw, FileWarning, Lock, UserX } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FilePermissionsDialog from "@/components/security/FilePermissionsDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Security() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Security Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage security for your WordPress sites
          </p>
        </div>
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Run All Checks
        </Button>
      </div>
    
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vulnerability Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vulnerability Scanner
            </CardTitle>
            <CardDescription>
              Scan your WordPress sites for known vulnerabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Scan
            </Button>
          </CardContent>
        </Card>

          {/* File Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5" />
                File Permissions
              </CardTitle>
              <CardDescription>
                Check for insecure file permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilePermissionsDialog 
                trigger={
                  <Button className="w-full" variant="outline">
                    Check Permissions
                  </Button>
                }
              />
            </CardContent>
          </Card>        {/* Failed Login Attempts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Login Security
            </CardTitle>
            <CardDescription>
              Monitor and block failed login attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              View Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
    </QueryClientProvider>
  );
}