import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInput,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Settings,
  Shield,
  RefreshCcw,
  Database,
  Search,
} from "lucide-react";
import React from "react";
import AddSiteDialog from "@/components/sites/AddSiteDialog";

function BrandMark() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="g"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="32" height="32" rx="8" fill="url(#g)" />
        <path
          d="M12 26l6-12 10 12"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-extrabold tracking-tight text-base">WP Nexus</span>
    </Link>
  );
}

function SidebarNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <BrandMark />
          <SidebarTrigger className="md:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link to="/" className="flex items-center gap-2">
                    <LayoutDashboard className="opacity-90" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/sites")}>
                  <Link to="/sites" className="flex items-center gap-2">
                    <Server className="opacity-90" />
                    <span>Sites</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <button
                  className="peer/menu-button flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-sidebar-foreground/80 cursor-not-allowed"
                  aria-disabled
                >
                  <RefreshCcw className="opacity-60" />
                  <span className="truncate">Updates</span>
                </button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <button
                  className="peer/menu-button flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-sidebar-foreground/80 cursor-not-allowed"
                  aria-disabled
                >
                  <Database className="opacity-60" />
                  <span className="truncate">Backups</span>
                </button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <button
                  className="peer/menu-button flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-sidebar-foreground/80 cursor-not-allowed"
                  aria-disabled
                >
                  <Shield className="opacity-60" />
                  <span className="truncate">Security</span>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")}>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="opacity-90" />
                    <span>General</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-sidebar-accent">
          <Avatar className="size-7">
            <AvatarFallback>CC</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">Catalin Cristian</div>
            <div className="text-[10px] text-sidebar-foreground/70 truncate">
              Admin
            </div>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarNav />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <TopBar />
        <div className="px-6 pb-8 pt-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function TopBar() {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/70",
      )}
    >
      <div className="px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <SidebarInput
              placeholder="Search sites, plugins, themes..."
              className="pl-8"
            />
          </div>
          <AddSiteDialog />
        </div>
      </div>
    </div>
  );
}
