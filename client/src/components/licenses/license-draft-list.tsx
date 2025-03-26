import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { License } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { LicenseRequestForm } from "./license-request-form";

export function LicenseDraftList() {
  const { toast } = useToast();
  const [editLicense, setEditLicense] = useState<License | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);

  const { data: draftLicenses = [], isLoading } = useQuery<License[]>({
    queryKey: ["/api/licenses/drafts"],
  });

  const handleEdit = (license: License) => {
    setEditLicense(license);
  };

  const handleDelete = (license: License) => {
    setLicenseToDelete(license);
    setDeleteConfirmOpen(true);
  };

  const sendLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/licenses/${id}`, { isDraft: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Licença enviada",
        description: "A solicitação de licença foi enviada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/licenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/drafts"] });
      toast({
        title: "Rascunho excluído",
        description: "O rascunho foi excluído com sucesso",
      });
      setDeleteConfirmOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to render vehicle info
  const getVehicleDisplay = (license: License) => {
    return license.primaryVehicleId ? `ID: ${license.primaryVehicleId}` : "Não selecionado";
  };

  // Helper function to render states
  const getStatesDisplay = (license: License) => {
    if (!license.states || license.states.length === 0) {
      return "Nenhum";
    }
    return license.states.join(", ");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando rascunhos...</div>;
  }

  if (draftLicenses.length === 0) {
    return (
      <div className="py-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-neutral-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-neutral-500 mb-2">Não há AETs pendentes de envio</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Rascunho</TableHead>
              <TableHead>Tipo de Conjunto</TableHead>
              <TableHead>Unid. Tratora</TableHead>
              <TableHead>Estados</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftLicenses.map((license) => (
              <TableRow key={license.id} className="hover:bg-neutral-50">
                <TableCell className="font-medium text-neutral-600">
                  DRAFT-{license.id}
                </TableCell>
                <TableCell className="text-neutral-500">{license.setType}</TableCell>
                <TableCell className="text-neutral-500">
                  {getVehicleDisplay(license)}
                </TableCell>
                <TableCell className="text-neutral-500">
                  {getStatesDisplay(license)}
                </TableCell>
                <TableCell className="text-neutral-500">
                  {formatDate(license.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-3 text-primary hover:text-primary/80"
                    onClick={() => handleEdit(license)}
                  >
                    Editar
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    size="sm"
                    onClick={() => sendLicenseMutation.mutate(license.id)}
                    disabled={sendLicenseMutation.isPending}
                  >
                    Enviar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit License Dialog */}
      <Dialog open={!!editLicense} onOpenChange={(open) => !open && setEditLicense(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Rascunho</DialogTitle>
            <DialogDescription>
              Atualize as informações do rascunho. Você pode salvar novamente ou enviar o pedido.
            </DialogDescription>
          </DialogHeader>
          {editLicense && (
            <LicenseRequestForm
              licenseToEdit={editLicense}
              onSuccess={() => setEditLicense(null)}
              onCancel={() => setEditLicense(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir este rascunho? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteLicenseMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => licenseToDelete && deleteLicenseMutation.mutate(licenseToDelete.id)}
              disabled={deleteLicenseMutation.isPending}
            >
              {deleteLicenseMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
