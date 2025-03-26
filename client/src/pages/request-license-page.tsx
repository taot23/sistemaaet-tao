import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LicenseDraftList } from "@/components/licenses/license-draft-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LicenseRequestForm } from "@/components/licenses/license-request-form";

export default function RequestLicensePage() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Solicitar Licença" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-neutral-600">Solicitar Licença</h2>
              <Button onClick={() => setFormDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Solicitar AET
              </Button>
            </div>
            
            {/* Pending Licenses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-600 mb-4">AETs Pendentes de Envio</h3>
              <LicenseDraftList />
            </div>
          </div>
        </main>
      </div>
      
      {/* License Request Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Solicitar AET</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para solicitar uma nova Autorização Especial de Trânsito.
            </DialogDescription>
          </DialogHeader>
          <LicenseRequestForm onSuccess={() => setFormDialogOpen(false)} onCancel={() => setFormDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
