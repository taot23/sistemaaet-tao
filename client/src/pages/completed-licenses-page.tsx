import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LicensesCompleted } from "@/components/licenses/licenses-completed";

export default function CompletedLicensesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Licenças Emitidas" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-600">Licenças Emitidas</h2>
            
            <LicensesCompleted />
          </div>
        </main>
      </div>
    </div>
  );
}
