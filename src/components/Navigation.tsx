import { Calendar, LayoutDashboard, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../contexts/UserContext";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user , loading: userLoading } = useUserContext();
  
  if(!user) return;

  const navItems = [
    { path: "/home", icon: Home, label: "Início" },
    { path: "/calendar", icon: Calendar, label: "Agenda" },
    { path: "/financial-records", icon: DollarSign, label: "Financeiro" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient">Organiza Pro</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="hover:shadow-md transition-smooth"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center gap-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="gap-2 flex-1"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
