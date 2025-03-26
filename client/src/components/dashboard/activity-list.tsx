import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, AlertTriangle, Plus, Clock } from "lucide-react";

export function ActivityList() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/activities"],
  });

  // Helper function to get the appropriate icon for an activity
  const getActivityIcon = (activity: Activity) => {
    if (activity.description.includes("aprovada") || activity.description.includes("liberada")) {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      );
    } else if (activity.description.includes("pendência") || activity.description.includes("documentação")) {
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        </div>
      );
    } else if (activity.description.includes("cadastrado")) {
      return (
        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mr-4">
          <Plus className="h-5 w-5 text-neutral-500" />
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
      );
    }
  };

  // Format relative time
  const formatRelativeTime = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  if (isLoading) {
    return <div className="py-4 text-center text-neutral-400">Carregando atividades...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <Clock className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
        <p className="text-neutral-500">Nenhuma atividade recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start p-3 hover:bg-neutral-50 rounded-lg transition-colors">
          {getActivityIcon(activity)}
          <div className="flex-1">
            <p className="text-neutral-600">{activity.description}</p>
            <p className="text-sm text-neutral-400 mt-1">{formatRelativeTime(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
