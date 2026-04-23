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
  ChevronDown,
  Home,
  CircleUser,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

  const renderGroup = (title: string, Icon: any, items: any[], iconColorClass: string) => (
    <SidebarGroup className="p-0">
      <SidebarMenu className="gap-1 px-2">
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton 
                tooltip={title}
                className={`h-11 rounded-xl transition-all duration-300 ${collapsed ? "justify-center p-0" : "px-3"}`}
              >
                <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 bg-muted border border-border/10 text-muted-foreground group-hover:text-foreground group-hover:bg-muted`}>
                  <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${iconColorClass}`} />
                </div>
                {!collapsed && (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors ml-2">
                      {title}
                    </span>
                    <ChevronDown className="ml-auto h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-2">
                {items.map(item => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton 
                        asChild 
                        isActive={active}
                        className={`h-9 rounded-lg transition-all ${
                          active 
                            ? "bg-emerald-500/10 text-emerald-600 font-medium" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <NavLink to={item.url} className="flex items-center gap-2 w-full">
                          <item.icon className={`h-3.5 w-3.5 ${active ? "text-emerald-600" : "text-muted-foreground"}`} />
                          <span className="text-xs">{item.title}</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/10 shadow-2xl bg-sidebar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader className="pt-6 pb-2 border-b border-border/5">
        <div className={`flex items-center transition-all duration-300 ${collapsed ? "justify-center" : "gap-3 px-2"}`}>
          <div className="flex shrink-0 items-center justify-center rounded-[0.8rem] shadow-lg shadow-emerald-600/20 h-8 w-8 overflow-hidden border border-border/5">
            <img src="/logo-continuum-v1.png" alt="Continuum Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-[15px] font-display font-black tracking-tight text-foreground whitespace-nowrap leading-tight">
                Continuum
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-emerald-600 uppercase mt-0.5 opacity-80">
                Doctor Portal
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full py-4 overflow-y-auto custom-scrollbar px-0">
        <div className="space-y-2">
          {renderGroup("Main Clinic", Home, topItems, "text-emerald-500")}
          {renderGroup("Clinical Logs", FileText, clinicalLogItems, "text-blue-500")}
          {(subscriptionTier === 'trial' || subscriptionTier === 'institutional') && 
            renderGroup("Enterprise Suite", Building2, enterpriseItems, "text-indigo-500")
          }
        </div>

        <div className="mt-auto pb-4">
          {renderGroup("Account", CircleUser, bottomItems, "text-slate-500")}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
