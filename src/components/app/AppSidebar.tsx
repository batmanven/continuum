import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Brain,
  Settings,
  Activity,
  Pill,
  User,
  Stethoscope,
  MessageSquare,
  ChevronDown,
  Bot,
  Receipt,
  BookUser,
  PillBottle,
  Hospital,
  ClipboardPlus,
  CircleUser,
  Cross,
  NotebookTabs,
  BriefcaseMedical,
  Siren,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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
import { useProfile } from "@/contexts/ProfileContext";

const clinicalIntelligence = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Health Memory", url: "/app/health-memory", icon: Brain },
  { title: "Symptom Checker", url: "/app/symptom-checker", icon: Activity },
  { title: "Medications", url: "/app/medications", icon: Pill },
  { title: "AI Summaries", url: "/app/doctor-summaries", icon: Bot },
  { title: "Bill Explainer", url: "/app/bill-explainer", icon: Receipt },
];

const specialistCare = [
  { title: "Find Doctors", url: "/app/doctor-search", icon: BriefcaseMedical },
  { title: "My Doctors", url: "/app/my-doctors", icon: Stethoscope },
  { title: "My Consultations", url: "/app/chats", icon: MessageSquare },
  { title: "My Prescriptions", url: "/app/prescriptions", icon: PillBottle },
  { title: "Medical Reports", url: "/app/reports", icon: ClipboardPlus },
];

const communityCare = [
  { title: "Emergency Contacts", url: "/app/emergency-contacts", icon: Siren },
  { title: "Family", url: "/app/guardians", icon: BookUser },
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
                  const isActive = location.pathname === item.url || (item.url === "/app" && (location.pathname === "/app/" || location.pathname === "/app"));
                  return (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton 
                        asChild 
                        isActive={isActive}
                        className={`h-9 rounded-lg transition-all ${
                          isActive 
                            ? "bg-primary/5 text-primary font-medium" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <NavLink to={item.url} className="flex items-center gap-2 w-full">
                          <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
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
      className="border-r border-border/5 shadow-2xl bg-sidebar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader className="pt-6 pb-2 border-b border-border/5">
        <div className={`flex items-center transition-all duration-300 ${collapsed ? "justify-center" : "gap-3 px-2"}`}>
          <div className="flex shrink-0 items-center justify-center rounded-[0.8rem] shadow-lg shadow-indigo-600/20 h-8 w-8 overflow-hidden border border-border/5">
            <img src="/logo-continuum-v1.png" alt="Continuum Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-[15px] font-display font-black tracking-tight text-foreground whitespace-nowrap leading-tight">
                Continuum
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col h-full py-4 overflow-y-auto custom-scrollbar px-0">
        <div className="space-y-2">
          {renderGroup("Health Centre", NotebookTabs, filteredIntelligence, "text-amber-500")}
          {renderGroup("Care Network", Cross, filteredCommunity, "text-indigo-500")}
          {renderGroup("My Clinic", Hospital, specialistCare, "text-emerald-500")}
        </div>

        <div className="mt-auto pb-4">
          {renderGroup("Identity Hub", CircleUser, accountItems, "text-slate-500")}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
