"use client";
import { PageEntrance } from "@/components/motion-provider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Settings2,
  BookOpen,
  Layers3,
  ArrowUpRight,
  LockKeyhole,
  ChevronsUpDown,
  LogOut,
  FileDown,
  PanelLeftClose,
  Library,
  Compass,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import type { Workspace } from "@/types/domain";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Layers3 size={19} strokeWidth={1.7} />
      </span>
      <span>
        personal<span className="brand-os">os</span>
      </span>
    </span>
  );
}
function Navigation({
  workspace,
  demo,
}: {
  workspace: Workspace;
  demo: boolean;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const base = demo ? "/preview" : "/app";
  const links = [
    { label: "Home", href: base, icon: Home, active: pathname === base },
    {
      label: "Personal",
      href: `${base}/personal`,
      icon: UserRound,
      future: true,
      active: pathname.endsWith("/personal"),
    },
    {
      label: "Business",
      href: `${base}/business`,
      icon: BriefcaseBusiness,
      future: true,
      active: pathname.endsWith("/business"),
    },
    {
      label: "Education",
      href: `${base}/education`,
      icon: GraduationCap,
      active: pathname === `${base}/education`,
    },
  ];
  return (
    <Sidebar className="os-sidebar" collapsible="offcanvas">
      <SidebarHeader className="sidebar-brand">
        <Link href={base} aria-label="Personal OS home">
          <Brand />
        </Link>
        <SidebarTrigger className="sidebar-close" />
      </SidebarHeader>
      <SidebarContent>
        <div className="workspace-label">
          <span className="workspace-avatar">{workspace.name[0]}</span>
          <div>
            <strong>{workspace.name}</strong>
            <span>Private workspace</span>
          </div>
          <LockKeyhole size={13} />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>WORKSPACE</SidebarGroupLabel>
          <SidebarMenu>
            {links.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={item.active}>
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.label}</span>
                    {item.future && <span className="nav-future">Future</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>EDUCATION</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === `${base}/education/campus` ||
                  pathname.includes("/modules/") ||
                  pathname.includes("/lectures/") ||
                  pathname.includes("/documents/")
                }
              >
                <Link
                  href={`${base}/education/campus`}
                  onClick={() => setOpenMobile(false)}
                >
                  <Library />
                  <span>Campus</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.endsWith("/education/self-learning")}
              >
                <Link
                  href={`${base}/education/self-learning`}
                  onClick={() => setOpenMobile(false)}
                >
                  <Compass />
                  <span>Self Learning</span>
                  <span className="nav-future">Future</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>CAMPUS</SidebarGroupLabel>
          <SidebarMenu>
            {[
              {
                label: "Semesters",
                href: `${base}/education/campus/semesters`,
                icon: Layers3,
              },
              {
                label: "Academic profile",
                href: `${base}/education/campus/profile`,
                icon: UserRound,
              },
            ].map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === item.href ||
                    (item.label === "Semesters" &&
                      pathname.includes("/semesters/"))
                  }
                >
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Link
          className="template-nav"
          href={`${base}/templates`}
          onClick={() => setOpenMobile(false)}
        >
          <FileDown size={16} />
          <div>
            <strong>Templates</strong>
          </div>
          <ArrowUpRight size={14} />
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.endsWith("/settings")}
            >
              <Link
                href={`${base}/settings`}
                onClick={() => setOpenMobile(false)}
              >
                <Settings2 />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="account-button">
              <span className="owner-avatar">{demo ? "S" : "O"}</span>
              <span>
                <strong>{demo ? "Sample workspace" : "Workspace owner"}</strong>
                <small>{demo ? "Read-only preview" : "Personal account"}</small>
              </span>
              <ChevronsUpDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <DropdownMenuLabel>
              {demo ? "Synthetic sample data" : "Your private workspace"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`${base}/settings`}>Workspace settings</Link>
            </DropdownMenuItem>
            {demo ? (
              <DropdownMenuItem asChild>
                <Link href="/login">Go to sign in</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  void signOut();
                }}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
export function Shell({
  children,
  workspace,
  demo = false,
}: {
  children: React.ReactNode;
  workspace: Workspace;
  demo?: boolean;
}) {
  const pathname = usePathname();
  const section =
    pathname.includes("/campus") || pathname.includes("/documents")
      ? "Campus"
      : pathname.endsWith("/settings")
        ? "Settings"
        : pathname.endsWith("/templates")
          ? "Templates"
          : pathname.endsWith("/personal")
            ? "Personal"
            : pathname.endsWith("/business")
              ? "Business"
              : pathname.includes("/education")
                ? "Education"
                : "Home";
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "228px" } as React.CSSProperties}
    >
      <Navigation workspace={workspace} demo={demo} />
      <div className="os-main">
        <header className="topbar">
          <div>
            <SidebarTrigger />
            <span className="topbar-separator" />
            <span className="topbar-area">
              {section === "Campus" ? (
                <>
                  <GraduationCap size={16} />
                  <span>Education</span>
                  <span className="muted">/</span>
                </>
              ) : (
                <Layers3 size={16} />
              )}
              <strong>{section}</strong>
            </span>
          </div>
          <span className="privacy-label">
            <LockKeyhole size={12} />
            {demo ? "Sample preview" : "Only you"}
          </span>
        </header>
        {demo && (
          <div className="preview-banner">
            <span>Read-only preview · all content is synthetic</span>
            <Link href="/login">
              Connect your workspace <ArrowUpRight size={12} />
            </Link>
          </div>
        )}
        <main id="main-content" className="page-container">
          <PageEntrance>{children}</PageEntrance>
        </main>
        <footer className="workspace-footer">
          <span>
            Personal OS <span className="footer-dot">·</span> Private workspace
          </span>
          <span>{workspace.timezone}</span>
        </footer>
      </div>
    </SidebarProvider>
  );
}
