import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getQueryFn } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { RefreshCw, Users, FileCheck, FileWarning, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardStats {
  userCount: number;
  pendingLicenses: number;
  approvedLicenses: number;
  rejectedLicenses: number;
  licensesByStatus: {
    status: string;
    count: number;
  }[];
}

export default function AdminDashboardPage() {
  const isMobile = useIsMobile();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Dados exemplo para o gráfico
  const statusData = [
    { status: "Pendente Cadastro", count: 8 },
    { status: "Cadastro em Andamento", count: 12 },
    { status: "Análise do Órgão", count: 5 },
    { status: "Pendente Liberação", count: 3 },
    { status: "Liberada", count: 18 },
    { status: "Reprovado", count: 4 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente Cadastro": return "#9ca3af";
      case "Cadastro em Andamento": return "#2563eb";
      case "Análise do Órgão": return "#f97316";
      case "Pendente Liberação": return "#d97706";
      case "Liberada": return "#16a34a";
      case "Reprovado": return "#dc2626";
      default: return "#9ca3af";
    }
  };

  const chartData = stats?.licensesByStatus || statusData;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard Administrativo" />
      
      <div className="flex flex-1">
        {!isMobile && <AdminSidebar />}
        
        <main className="flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    stats?.userCount || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Usuários registrados no sistema
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Licenças Pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    stats?.pendingLicenses || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando aprovação
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Licenças Aprovadas
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    stats?.approvedLicenses || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Emitidas com sucesso
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Licenças Reprovadas
                </CardTitle>
                <FileWarning className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    stats?.rejectedLicenses || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reprovadas por pendência de documentação
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Licenças por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Quantidade"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}