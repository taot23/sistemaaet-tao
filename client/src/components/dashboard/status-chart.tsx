import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { License, licenseStatuses } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Color mapping for each status
const statusColors = {
  "Pendente Cadastro": "hsl(var(--chart-1))",
  "Cadastro em Andamento": "hsl(var(--chart-2))",
  "Reprovado – Pendência de Documentação": "hsl(var(--chart-3))",
  "Análise do Órgão": "hsl(var(--chart-4))",
  "Pendente Liberação": "hsl(var(--chart-5))",
  "Liberada": "hsl(var(--primary))",
};

type TimeRange = "7days" | "30days" | "year";

export function StatusChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("year");
  
  const { data: inProgressLicenses = [] } = useQuery<License[]>({
    queryKey: ["/api/licenses/in-progress"],
  });
  
  const { data: completedLicenses = [] } = useQuery<License[]>({
    queryKey: ["/api/licenses/completed"],
  });

  // Combine all licenses
  const allLicenses = [...inProgressLicenses, ...completedLicenses];

  // Filter licenses based on time range
  const getFilteredLicenses = () => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case "7days":
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "30days":
        cutoffDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "year":
      default:
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }
    
    return allLicenses.filter(license => new Date(license.createdAt) >= cutoffDate);
  };

  // Group licenses by status
  const getLicensesByStatus = () => {
    const filteredLicenses = getFilteredLicenses();
    const statusCounts = licenseStatuses.map(status => ({
      status,
      count: filteredLicenses.filter(l => l.status === status).length
    }));
    
    // Sort by count, descending
    return statusCounts.sort((a, b) => b.count - a.count);
  };

  const data = getLicensesByStatus();

  // If no data available
  if (data.every(item => item.count === 0)) {
    return (
      <div className="h-64 w-full bg-neutral-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end space-x-2">
        <Button
          variant={timeRange === "7days" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange("7days")}
        >
          Últimos 7 dias
        </Button>
        <Button
          variant={timeRange === "30days" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange("30days")}
        >
          Últimos 30 dias
        </Button>
        <Button
          variant={timeRange === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange("year")}
        >
          Este ano
        </Button>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="status" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.split(' ')[0]} // Only first word for better display
            />
            <YAxis allowDecimals={false} />
            <Tooltip 
              formatter={(value, name, props) => [value, "Licenças"]}
              labelFormatter={(label) => label} // Full status name
            />
            <Bar dataKey="count" name="Licenças">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={statusColors[entry.status as keyof typeof statusColors] || "hsl(var(--chart-1))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
