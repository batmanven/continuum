import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Heart,
  User,
  Users,
  Stethoscope,
  Pill,
  FileText,
  Building2,
  Database,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const topItems = [
  { title: "Dashboard", url: "/doctor", icon: LayoutDashboard },
  { title: "Patients", url: "/doctor/patients", icon: Users },
];

const clinicalLogItems = [
  { title: "Consultations", url: "/doctor/consultations", icon: Stethoscope },
  { title: "Prescriptions", url: "/doctor/prescriptions", icon: Pill },
  { title: "Medical Reports", url: "/doctor/reports", icon: FileText },
];

const enterpriseItems = [
  { title: "Inst. Dashboard", url: "/doctor/enterprise", icon: Building2 },
  { title: "EHR Sync Hub", url: "/doctor/enterprise/ehr-hub", icon: Database },
  { title: "Billing Decoder", url: "/doctor/enterprise/billing", icon: Wallet },
  { title: "Personnel Hub", url: "/doctor/enterprise/staff", icon: ShieldCheck },
];

const bottomItems = [
  { title: "Profile", url: "/doctor/profile", icon: User },
  { title: "Settings", url: "/doctor/settings", icon: Settings },
];

export function DoctorSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { subscriptionTier } = useProfile();

  const isActive = (url: string) =>
    url === "/doctor"
      ? location.pathname === "/doctor" || location.pathname === "/doctor/"
      : location.pathname.startsWith(url);

  const renderNavItem = (item: { title: string; url: string; icon: any }, isSmall = false) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          id={`tour-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
          className={`h-11 rounded-xl transition-all duration-300 ${collapsed ? "justify-center p-0" : "px-2"}`}
          tooltip={collapsed ? item.title : undefined}
        >
          <NavLink
            to={item.url}
            className={`flex items-center w-full transition-all group py-1 ${collapsed ? "justify-center px-0" : "gap-3 px-2"
              } ${active ? "bg-muted border-border/10 shadow-inner" : "hover:bg-muted/50"}`}
          >
            <div className={`shrink-0 ${isSmall ? 'h-7 w-7' : 'h-8 w-8'} rounded-xl flex items-center justify-center transition-all duration-300 ${active
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-105"
              : "bg-muted border border-border/10 text-muted-foreground group-hover:text-foreground"
              }`}>
              <item.icon className={`${isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 transition-transform group-hover:scale-110`} />
            </div>
            {!collapsed && (
              <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                {item.title}
              </span>
            )}
            {active && !collapsed && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/10 shadow-2xl transition-all duration-500 ease-in-out bg-sidebar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader className="h-20 border-b border-border/10 bg-muted/20 p-4 px-6 flex items-center overflow-hidden">
        <div className={`flex items-center gap-3 min-w-0 transition-all duration-500 ${collapsed ? 'opacity-0 translate-x-[-10px]' : 'opacity-100 translate-x-0'}`}>
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20 h-10 w-10">
            <Heart className="h-5 w-5 text-white fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-display font-bold tracking-tight text-foreground whitespace-nowrap">
              Continuum
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600 whitespace-nowrap">
              Doctor Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full py-4 transition-all duration-500 overflow-y-auto custom-scrollbar px-0">
        <div className="flex flex-col gap-4">
          {/* Main Navigation */}
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className={`gap-1.5 ${collapsed ? 'px-0' : 'px-2'}`}>
                {topItems.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Clinical Logs Section */}
          <SidebarGroup className="p-0">
            {!collapsed && (
              <SidebarGroupLabel className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Clinical Logs
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={`gap-1.5 ${collapsed ? 'px-0' : 'px-2'}`}>
                {clinicalLogItems.map((item) => renderNavItem(item, true))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Enterprise Suite Section - Gated by Tier */}
          {(subscriptionTier === 'trial' || subscriptionTier === 'institutional') && (
            <SidebarGroup className="p-0">
              {!collapsed && (
                <SidebarGroupLabel className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.3em] text-primary/60 flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  Enterprise Suite
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className={`gap-1.5 ${collapsed ? 'px-0' : 'px-2'}`}>
                  {enterpriseItems.map((item) => renderNavItem(item, true))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>

        {/* Bottom Navigation */}
        <SidebarGroup className="mt-auto pb-4 p-0">
          <SidebarGroupContent>
            <SidebarMenu className={`gap-1.5 ${collapsed ? 'px-0' : 'px-2'}`}>
              {bottomItems.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
