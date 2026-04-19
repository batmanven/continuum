import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Brain,
  FileText,
  Settings,
  Heart,
  Activity,
  Users,
  Pill,
  User,
  Zap,
  Stethoscope,
  MessageSquare,
  ChevronDown,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useProfile } from "@/contexts/ProfileContext";

const clinicalIntelligence = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Health Memory", url: "/app/health-memory", icon: Brain },
  { title: "Symptom Checker", url: "/app/symptom-checker", icon: Activity },
  { title: "Doctor Summaries", url: "/app/doctor-summaries", icon: ClipboardList },
  { title: "Bill Explainer", url: "/app/bill-explainer", icon: FileText },
];

const specialistCare = [
  { title: "Find Doctors", url: "/app/doctor-search", icon: Stethoscope },
  { title: "My Doctors", url: "/app/my-doctors", icon: Users },
  { title: "My Consultations", url: "/app/chats", icon: MessageSquare },
  { title: "My Prescriptions", url: "/app/prescriptions", icon: Pill },
  { title: "Medical Reports", url: "/app/reports", icon: FileText },
];

const communityCare = [
  { title: "Guardians", url: "/app/guardians", icon: Users },
  { title: "Medications", url: "/app/medications", icon: Pill },
];

const accountItems = [
  { title: "Profile", url: "/app/profile", icon: User },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpen, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const location = useLocation();
  const { subscriptionTier } = useProfile();

  const isPremium = subscriptionTier === 'trial' || subscriptionTier === 'premium';

  // Reactive filtering of premium items
  const filteredIntelligence = clinicalIntelligence.filter(item => {
    if (item.url === "/app/bill-explainer") return isPremium;
    return true;
  });

  const filteredCommunity = communityCare;

  const renderNavItems = (navItems: any[]) => (
    <SidebarMenu className={`gap-1 ${collapsed ? 'px-0' : 'px-2'}`}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.url || (item.url === "/app" && (location.pathname === "/app/" || location.pathname === "/app"));
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              className={`h-11 rounded-xl transition-all duration-300 ${collapsed ? "justify-center p-0" : "px-3"}`}
              tooltip={collapsed ? item.title : undefined}
            >
              <NavLink
                id={`tour-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                to={item.url}
                className={`flex items-center w-full transition-all group py-1 ${
                  collapsed ? "justify-center px-0" : "gap-3 px-2"
                } ${
                  isActive 
                    ? "bg-primary/5 border-primary/10" 
                    : "hover:bg-muted/50"
                }`}
              >
                <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                    : "bg-muted border border-border/10 text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                }`}>
                  <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                </div>
                {!collapsed && (
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {item.title}
                  </span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
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
      className="border-r border-border/5 shadow-2xl transition-all duration-500 ease-in-out bg-sidebar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >      
      <SidebarContent className="flex flex-col h-full py-4 transition-all duration-500 overflow-y-auto custom-scrollbar px-0">
        <div className="space-y-6">
          {/* Clinical Intelligence Section */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel asChild className="px-5 mb-2 h-auto">
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-foreground transition-colors group">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">Intel Engine</span>
                  </div>
                  {!collapsed && <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  {renderNavItems(filteredIntelligence)}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Specialist Care Section */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel asChild className="px-5 mb-2 h-auto">
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-foreground transition-colors group">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">Clinical Vault</span>
                  </div>
                  {!collapsed && <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  {renderNavItems(specialistCare)}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Community & Care Section */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel asChild className="px-5 mb-2 h-auto">
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-foreground transition-colors group">
                   <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-indigo-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">Care Circle</span>
                  </div>
                  {!collapsed && <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  {renderNavItems(filteredCommunity)}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </div>

        {/* Global Identity Section */}
        <SidebarGroup className="mt-auto pb-4 p-0">
            <SidebarGroupLabel className="px-5 mb-2 h-auto text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                Identity Hub
            </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(accountItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
