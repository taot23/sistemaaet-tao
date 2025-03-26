import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { VehicleList } from "@/components/vehicles/vehicle-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export default function VehiclesPage() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Veículos Cadastrados" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-neutral-600">Veículos Cadastrados</h2>
              <Button onClick={() => setFormDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar Veículo
              </Button>
            </div>
            
            <VehicleList />
          </div>
        </main>
      </div>
      
      {/* Vehicle Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Veículo</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para cadastrar um novo veículo. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <VehicleForm onSuccess={() => setFormDialogOpen(false)} onCancel={() => setFormDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
