import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Brain,
  FileText,
  Settings,
  Heart,
  History,
  ClipboardList,
  Activity,
  Users,
  Pill,
  User,
  Zap,
  Stethoscope,
  MessageSquare,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Guardians", url: "/app/guardians", icon: Users },
  { title: "Medications", url: "/app/medications", icon: Pill },
  { title: "Health Memory", url: "/app/health-memory", icon: Brain },
  { title: "Bill Explainer", url: "/app/bill-explainer", icon: FileText },
  { title: "Doctor Summaries", url: "/app/doctor-summaries", icon: ClipboardList },
  { title: "Symptom Checker", url: "/app/symptom-checker", icon: Activity },
];

const clinicItems = [
  { title: "Find Doctors", url: "/app/doctor-search", icon: Stethoscope },
  { title: "My Consultations", url: "/app/chats", icon: MessageSquare },
];

const bottomItems = [
  { title: "Profile", url: "/app/profile", icon: User },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderNavItems = (navItems: typeof items) => (
    <SidebarMenu className="gap-1.5">
      {navItems.map((item) => {
        const isActive = location.pathname === item.url || (item.url === "/app" && location.pathname === "/app/");
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              className={`h-11 rounded-xl transition-all duration-300 ${collapsed ? "justify-center p-0" : "px-2"}`}
              tooltip={collapsed ? item.title : undefined}
            >
              <NavLink
                id={`tour-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                to={item.url}
                className={`flex items-center w-full transition-all group py-1 ${
                  collapsed ? "justify-center px-0" : "gap-3 px-2"
                } ${
                  isActive 
                    ? "bg-muted border-border/10 shadow-inner" 
                    : "hover:bg-muted/50"
                }`}
              >
                <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-105" 
                    : "bg-muted border border-border/10 text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                }`}>
                  <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                </div>
                {!collapsed && (
                  <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {item.title}
                  </span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                )}
              </NavLink>
            </SidebarMenuButton>

          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/10 shadow-2xl transition-all duration-500 ease-in-out bg-sidebar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader className="h-20 border-b border-border/10 bg-muted/20 p-4 px-6 flex items-center overflow-hidden">
        <div className={`flex items-center gap-3 min-w-0 transition-all duration-500 ${collapsed ? 'opacity-0 translate-x-[-10px]' : 'opacity-100 translate-x-0'}`}>
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 h-10 w-10">
            <Heart className="h-5 w-5 text-primary-foreground fill-primary-foreground/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-display font-bold tracking-tight text-foreground whitespace-nowrap">
              Continuum
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary whitespace-nowrap">
              Health Hub
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col justify-between h-full py-4 transition-all duration-500 px-2">
        <div>
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              {renderNavItems(items)}
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup className="p-0 mt-6">
        
            <SidebarGroupContent>
              {renderNavItems(clinicItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <SidebarGroup className="mt-auto pb-4 p-0">
          <SidebarGroupContent>
            {renderNavItems(bottomItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}



