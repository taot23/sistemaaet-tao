import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Truck,
  FileText,
  ClipboardList,
  FileCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn(
        "w-64 bg-white shadow-md h-full flex flex-col",
        className
      )}
    >
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-primary">Sistema AET</h1>
        <p className="text-sm text-neutral-400">Controle de Licenças</p>
      </div>

      <div className="flex items-center p-4 border-b border-neutral-200">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
          {user ? getInitials(user.fullName) : "..."}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-neutral-600">
            {user?.fullName}
          </p>
          <p className="text-xs text-neutral-400">{user?.email}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <Link 
          href="/"
          className={cn(
            "flex items-center px-4 py-3 text-neutral-600 hover:text-primary",
            location === "/"
              ? "bg-primary bg-opacity-10 border-l-4 border-primary"
              : "border-l-4 border-transparent"
          )}
        >
          <LayoutDashboard className="h-5 w-5 mr-3" />
          Dashboard
        </Link>

        <Link 
          href="/vehicles"
          className={cn(
            "flex items-center px-4 py-3 text-neutral-600 hover:text-primary",
            location === "/vehicles"
              ? "bg-primary bg-opacity-10 border-l-4 border-primary"
              : "border-l-4 border-transparent"
          )}
        >
          <Truck className="h-5 w-5 mr-3" />
          Veículos Cadastrados
        </Link>

        <Link 
          href="/request-license"
          className={cn(
            "flex items-center px-4 py-3 text-neutral-600 hover:text-primary",
            location === "/request-license"
              ? "bg-primary bg-opacity-10 border-l-4 border-primary"
              : "border-l-4 border-transparent"
          )}
        >
          <FileText className="h-5 w-5 mr-3" />
          Solicitar Licença
        </Link>

        <Link 
          href="/track-license"
          className={cn(
            "flex items-center px-4 py-3 text-neutral-600 hover:text-primary",
            location === "/track-license"
              ? "bg-primary bg-opacity-10 border-l-4 border-primary"
              : "border-l-4 border-transparent"
          )}
        >
          <ClipboardList className="h-5 w-5 mr-3" />
          Acompanhar Licença
        </Link>

        <Link 
          href="/completed-licenses"
          className={cn(
            "flex items-center px-4 py-3 text-neutral-600 hover:text-primary",
            location === "/completed-licenses"
              ? "bg-primary bg-opacity-10 border-l-4 border-primary"
              : "border-l-4 border-transparent"
          )}
        >
          <FileCheck className="h-5 w-5 mr-3" />
          Licenças Emitidas
        </Link>
      </nav>

      <Separator />
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-neutral-600 hover:text-primary"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {logoutMutation.isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </div>
  );
}
