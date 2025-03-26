import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQueryFn } from "@/lib/queryClient";
import { License } from "@shared/schema";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AdminDashboardPage() {
  const isMobile = useIsMobile();
  const { data: licenses, isLoading } = useQuery<License[]>({
    queryKey: ["/api/admin/licenses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const countByStatus = licenses?.reduce((acc, license) => {
    acc[license.status] = (acc[license.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Painel Administrativo" />
      
      <div className="flex flex-1">
        {!isMobile && <AdminSidebar />}
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao painel administrativo do sistema de controle de licenças AET.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Licenças
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {licenses?.length || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(countByStatus["Pendente Cadastro"] || 0) + 
                       (countByStatus["Cadastro em Andamento"] || 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Em Análise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {countByStatus["Análise do Órgão"] || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Liberadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {countByStatus["Liberada"] || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Acesso Rápido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button asChild className="w-full">
                        <Link href="/admin/licenses">
                          Gerenciar Licenças
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/admin/users">
                          Gerenciar Usuários
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Status das Licenças</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(countByStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <div className="text-sm">{status}</div>
                          <div className="font-medium">{count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}