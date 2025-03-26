import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LicensesInProgress } from "@/components/licenses/licenses-in-progress";

export default function TrackLicensePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Acompanhar Licença" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-600">Acompanhar Licença</h2>
            
            <LicensesInProgress />
          </div>
        </main>
      </div>
    </div>
  );
}
