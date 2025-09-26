import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Bot, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/agency" },
  { name: "Settlements", icon: FileText, path: "/agency/settlements" },
  { name: "Simulator", icon: Bot, path: "/agency/simulator" },
];
export default function AgencyLayout() {
  const location = useLocation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="min-h-screen flex flex-col bg-muted/40 text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-primary">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <h1 className="text-xl font-bold font-display text-primary">Aura Dental</h1>
          <span className="text-xl font-light text-muted-foreground">| Agency Portal</span>
        </div>
        <nav className="flex-1 flex justify-center items-center gap-4">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/agency"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster richColors closeButton />
    </div>
  );
}