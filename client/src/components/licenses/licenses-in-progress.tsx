import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { License, licenseStatuses } from "@shared/schema";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FileInput } from "@/components/ui/file-input";

export function LicensesInProgress() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const itemsPerPage = 10;

  const { data: licenses = [], isLoading } = useQuery<License[]>({
    queryKey: ["/api/licenses/in-progress"],
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("licenseFile", file);
      formData.append("status", "Liberada");
      
      const response = await fetch(`/api/licenses/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer upload do arquivo");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      toast({
        title: "Upload realizado",
        description: "O arquivo da licença foi enviado com sucesso",
      });
      setUploadDialogOpen(false);
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDetails = (license: License) => {
    setSelectedLicense(license);
  };

  const handleUploadFile = (license: License) => {
    setSelectedLicense(license);
    setUploadDialogOpen(true);
  };

  const submitFileUpload = () => {
    if (selectedLicense && file) {
      uploadFileMutation.mutate({ id: selectedLicense.id, file });
    } else {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para fazer upload",
        variant: "destructive",
      });
    }
  };

  // Filter licenses based on search and status
  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch = license.licenseNumber
      ? license.licenseNumber.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesStatus = statusFilter
      ? license.status === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLicenses = filteredLicenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Get status badge class based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Pendente Cadastro":
      case "Cadastro em Andamento":
      case "Pendente Liberação":
        return "bg-yellow-100 text-yellow-800"; // pending
      case "Reprovado – Pendência de Documentação":
        return "bg-red-100 text-red-800"; // denied
      case "Análise do Órgão":
        return "bg-blue-100 text-blue-800"; // processing
      case "Liberada":
        return "bg-green-100 text-green-800"; // approved
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get primary vehicle info from license
  const getPrimaryVehicle = (license: License) => {
    return `ID: ${license.primaryVehicleId}`;
  };

  // Helper function to get state name
  const getStateName = (license: License) => {
    return license.states && license.states.length > 0 
      ? license.states[0] 
      : "N/A";
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando licenças...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Input
            placeholder="Buscar por número da licença..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="h-4 w-4 absolute left-3 top-3 text-neutral-400" />
        </div>

        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              {licenseStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            setSearch("");
            setStatusFilter("");
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Tipo de Conjunto</TableHead>
              <TableHead>Unid. Tratora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Data Solicitação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLicenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nenhuma licença em andamento encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLicenses.map((license) => (
                <TableRow key={license.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium text-neutral-600">
                    {license.licenseNumber || `AET-${license.id}`}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {license.setType}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {getPrimaryVehicle(license)}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {getStateName(license)}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {formatDate(license.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getStatusBadgeClass(
                        license.status
                      )}`}
                    >
                      {license.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleOpenDetails(license)}
                    >
                      Detalhes
                    </Button>
                    {license.status === "Liberada" && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 ml-2"
                        size="sm"
                        onClick={() => handleUploadFile(license)}
                      >
                        Upload
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-neutral-200">
            <div>
              <p className="text-sm text-neutral-700">
                Mostrando{" "}
                <span className="font-medium">{startIndex + 1}</span> a{" "}
                <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredLicenses.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium">{filteredLicenses.length}</span>{" "}
                resultados
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* License Details Dialog */}
      <Dialog
        open={!!selectedLicense && !uploadDialogOpen}
        onOpenChange={(open) => !open && setSelectedLicense(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Licença</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a licença{" "}
              {selectedLicense?.licenseNumber || `AET-${selectedLicense?.id}`}
            </DialogDescription>
          </DialogHeader>

          {selectedLicense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Número da Licença
                  </h4>
                  <p className="text-neutral-700">
                    {selectedLicense.licenseNumber || `AET-${selectedLicense.id}`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Status
                  </h4>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-md mt-1 ${getStatusBadgeClass(
                      selectedLicense.status
                    )}`}
                  >
                    {selectedLicense.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Tipo de Conjunto
                  </h4>
                  <p className="text-neutral-700">{selectedLicense.setType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Comprimento
                  </h4>
                  <p className="text-neutral-700">{selectedLicense.setLength} m</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Data de Solicitação
                  </h4>
                  <p className="text-neutral-700">
                    {formatDate(selectedLicense.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Estados
                  </h4>
                  <p className="text-neutral-700">
                    {selectedLicense.states?.join(", ") || "Nenhum"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <h4 className="text-sm font-semibold text-neutral-500 mb-2">
                  Veículos do Conjunto
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">Unidade Tratora</p>
                    <p className="text-neutral-700">ID: {selectedLicense.primaryVehicleId}</p>
                  </div>
                  {selectedLicense.firstTrailerId && (
                    <div>
                      <p className="text-xs text-neutral-500">
                        {selectedLicense.setType === "Prancha" ? "Prancha" : "1ª Carreta"}
                      </p>
                      <p className="text-neutral-700">ID: {selectedLicense.firstTrailerId}</p>
                    </div>
                  )}
                  {selectedLicense.dollyId && (
                    <div>
                      <p className="text-xs text-neutral-500">Dolly</p>
                      <p className="text-neutral-700">ID: {selectedLicense.dollyId}</p>
                    </div>
                  )}
                  {selectedLicense.secondTrailerId && (
                    <div>
                      <p className="text-xs text-neutral-500">2ª Carreta</p>
                      <p className="text-neutral-700">ID: {selectedLicense.secondTrailerId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedLicense(null)}
            >
              Fechar
            </Button>
            {selectedLicense?.status === "Liberada" && (
              <Button
                onClick={() => {
                  setUploadDialogOpen(true);
                }}
              >
                Upload de Arquivo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUploadDialogOpen(false);
            setFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo de Licença</DialogTitle>
            <DialogDescription>
              Faça o upload do arquivo da licença liberada{" "}
              {selectedLicense?.licenseNumber || `AET-${selectedLicense?.id}`}
            </DialogDescription>
          </DialogHeader>

          <FileInput
            onValueChange={(file) => setFile(file)}
            description="PDF, JPG, PNG até 10MB"
            allowedTypes=".pdf,.jpg,.jpeg,.png"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setFile(null);
              }}
              disabled={uploadFileMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitFileUpload}
              disabled={!file || uploadFileMutation.isPending}
            >
              {uploadFileMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
