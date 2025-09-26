import {
  LayoutDashboard,
  Users,
  User,
  Calendar,
  BarChart3,
  Briefcase,
  Settings,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Leads", icon: Users, path: "/leads" },
  { name: "Calendar", icon: Calendar, path: "/calendar" },
  { name: "Reports", icon: BarChart3, path: "/reports" },
  { name: "Agency Portal", icon: Briefcase, path: "/agency" },
  { name: "AI Chatbot", icon: Bot, path: "/chatbot" },
];
const bottomNavItems = [
  { name: "Settings", icon: Settings, path: "/settings" },
  { name: "Support", icon: LifeBuoy, path: "/support" },
];
const NavItem = ({ item, isCollapsed }: { item: typeof navItems[0], isCollapsed: boolean }) => {
  const location = useLocation();
  // For leads and patients, we want to highlight if the path starts with /leads or /patients
  const isActive = item.path === "/leads"
    ? location.pathname.startsWith("/leads") || location.pathname.startsWith("/patients")
    : location.pathname === item.path;
  const linkContent = (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200",
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}>
      <item.icon className="h-5 w-5" />
      {!isCollapsed && <span className="font-medium">{item.name}</span>}
    </div>
  );
  return (
    <NavLink to={item.path}>
      {isCollapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        linkContent
      )}
    </NavLink>
  );
};
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <aside className={cn(
      "relative flex flex-col h-screen bg-card border-r transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center h-16 px-6 border-b">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={cn("h-8 w-8 text-primary transition-transform duration-300", isCollapsed && "rotate-90")}>
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        {!isCollapsed && <h1 className="ml-3 text-xl font-bold font-display text-primary">Aura Dental</h1>}
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.name} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
      <div className="px-4 py-6 mt-auto space-y-2 border-t">
        {bottomNavItems.map((item) => (
          <NavItem key={item.name} item={item} isCollapsed={isCollapsed} />
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -right-5 transform -translate-y-1/2 bg-card border rounded-full h-8 w-8 hover:bg-accent"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </aside>
  );
}