import {
  ChevronRight,
  LucideIcon,
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Home
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  href: string;
}

function SidebarItem({ icon: Icon, label, active, href }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-all hover:text-primary",
        active ? "bg-muted font-semibold text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
    </Link>
  );
}

export function AdminSidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col overflow-y-auto border-r bg-background p-4",
        className
      )}
    >
      <div className="flex flex-col gap-1 mt-2">
        <div className="px-3 py-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Painel Administrativo
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerenciamento de licenças AET
          </p>
        </div>
        
        <div className="mt-8 flex flex-col gap-1">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/admin"
            active={location === "/admin"}
          />
          <SidebarItem
            icon={FileText}
            label="Licenças"
            href="/admin/licenses"
            active={location === "/admin/licenses"}
          />
          <SidebarItem
            icon={Users}
            label="Usuários"
            href="/admin/users"
            active={location === "/admin/users"}
          />
        </div>
        
        <div className="mt-auto mb-4 space-y-2">
          <SidebarItem
            icon={Home}
            label="Voltar ao Portal"
            href="/"
            active={false}
          />
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}