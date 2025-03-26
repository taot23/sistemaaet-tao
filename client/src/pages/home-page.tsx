import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityList } from "@/components/dashboard/activity-list";
import { StatusChart } from "@/components/dashboard/status-chart";
import { CheckCircle, Clock, Truck, Activity } from "lucide-react";

interface DashboardStats {
  licenseCount: number;
  pendingLicenses: number;
  vehicleCount: number;
}

export default function HomePage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Licenças Emitidas"
                value={isLoading ? "..." : stats?.licenseCount || 0}
                icon={
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                }
                trend={{
                  value: "12% de aumento no último mês",
                  positive: true,
                }}
              />
              
              <StatsCard
                title="Licenças Pendentes"
                value={isLoading ? "..." : stats?.pendingLicenses || 0}
                icon={
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                }
                subtitle="Acompanhe o status em tempo real"
              />
              
              <StatsCard
                title="Veículos Cadastrados"
                value={isLoading ? "..." : stats?.vehicleCount || 0}
                icon={
                  <div className="w-12 h-12 bg-neutral-200 bg-opacity-50 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-neutral-500" />
                  </div>
                }
                subtitle="Gerencie sua frota de forma eficiente"
              />
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-600">Atividade Recente</h3>
              </div>
              
              <ActivityList />
            </div>
            
            {/* Status Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-600">Visão Geral de Status</h3>
              </div>
              
              <StatusChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
