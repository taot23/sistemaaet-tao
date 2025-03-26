import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-neutral-600">{title}</h2>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-6 w-6 text-neutral-500" />
        </Button>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex items-center">
          <span className="text-sm font-medium text-neutral-600 mr-2">
            {user?.fullName}
          </span>
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            {user ? getInitials(user.fullName) : "..."}
          </div>
        </div>
      </div>
    </header>
  );
}
