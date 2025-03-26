import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { License } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Download, CalendarIcon } from "lucide-react";
import { states } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function LicensesCompleted() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const itemsPerPage = 10;

  const { data: licenses = [], isLoading } = useQuery<License[]>({
    queryKey: ["/api/licenses/completed"],
  });

  // Filter licenses based on search, state and date
  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch = 
      (license.licenseNumber?.toLowerCase().includes(search.toLowerCase()) || false) || 
      getPrimaryVehicle(license).toLowerCase().includes(search.toLowerCase());
    
    const matchesState = stateFilter
      ? license.states?.includes(stateFilter)
      : true;
    
    const matchesDate = date
      ? new Date(license.createdAt).toDateString() === date.toDateString()
      : true;
    
    return matchesSearch && matchesState && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLicenses = filteredLicenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleOpenDetails = (license: License) => {
    setSelectedLicense(license);
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

  // Format expiration date
  const formatExpirationDate = (license: License) => {
    if (!license.expirationDate) {
      return "N/A";
    }
    return formatDate(license.expirationDate);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando licenças emitidas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Input
            placeholder="Buscar por número da licença ou placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="h-4 w-4 absolute left-3 top-3 text-neutral-400" />
        </div>

        <div className="w-40">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os estados</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-52">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? formatDate(date) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            setSearch("");
            setStateFilter("");
            setDate(undefined);
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Licença</TableHead>
              <TableHead>Tipo de Conjunto</TableHead>
              <TableHead>Unid. Tratora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLicenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Nenhuma licença emitida encontrada.
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
                    {formatDate(license.issueDate || license.createdAt)}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {formatExpirationDate(license)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2 text-primary hover:text-primary/80"
                      onClick={() => handleOpenDetails(license)}
                    >
                      Detalhes
                    </Button>
                    {license.licenseFileUrl && (
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={license.licenseFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
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
        open={!!selectedLicense}
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
                    className="inline-block px-2 py-1 text-xs font-medium rounded-md mt-1 bg-green-100 text-green-800"
                  >
                    Liberada
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
                    Data de Emissão
                  </h4>
                  <p className="text-neutral-700">
                    {formatDate(selectedLicense.issueDate || selectedLicense.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500">
                    Data de Validade
                  </h4>
                  <p className="text-neutral-700">
                    {formatExpirationDate(selectedLicense)}
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
            {selectedLicense?.licenseFileUrl && (
              <Button
                asChild
              >
                <a 
                  href={selectedLicense.licenseFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
