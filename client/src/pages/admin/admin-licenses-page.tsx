import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { License, licenseStatuses } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, FileUp, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FileInput } from "@/components/ui/file-input";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
  "Pendente Cadastro": { label: "Pendente Cadastro", variant: "outline" },
  "Cadastro em Andamento": { label: "Cadastro em Andamento", variant: "secondary" },
  "Reprovado": { label: "Reprovado", variant: "destructive" },
  "Análise do Órgão": { label: "Análise do Órgão", variant: "default" },
  "Pendente Liberação": { label: "Pendente Liberação", variant: "secondary" },
  "Liberada": { label: "Liberada", variant: "success" },
};

const updateStatusSchema = z.object({
  status: z.string().refine(
    (value) => licenseStatuses.includes(value),
    { message: "Status inválido" }
  ),
});

const uploadFileSchema = z.object({
  licenseNumber: z.string().optional(),
  issueDate: z.date({ required_error: "Data de emissão é obrigatória" }),
  expirationDate: z.date({ required_error: "Data de validade é obrigatória" }),
  licenseFile: z.instanceof(File, { message: "O arquivo da licença é obrigatório" }),
});

type UploadFileValues = z.infer<typeof uploadFileSchema>;

export default function AdminLicensesPage() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const { data: licenses, isLoading, refetch } = useQuery<License[]>({
    queryKey: ["/api/admin/licenses", selectedStatus],
    queryFn: () => {
      const url = selectedStatus
        ? `/api/admin/licenses?status=${encodeURIComponent(selectedStatus)}`
        : "/api/admin/licenses";
      return getQueryFn({ on401: "throw" })(url);
    },
  });

  const statusForm = useForm({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: "",
    },
  });

  const uploadForm = useForm<UploadFileValues>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: {
      licenseNumber: "",
      issueDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano depois
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (values: { licenseId: number; status: string }) => {
      const { licenseId, status } = values;
      const res = await apiRequest(
        "PUT",
        `/api/admin/licenses/${licenseId}/status`,
        { status }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da licença foi atualizado com sucesso.",
      });
      setIsStatusDialogOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status da licença.",
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (values: UploadFileValues & { licenseId: number }) => {
      const { licenseId, licenseFile, ...rest } = values;
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append("licenseFile", licenseFile);
      formData.append("licenseNumber", rest.licenseNumber || "");
      formData.append("issueDate", rest.issueDate.toISOString());
      formData.append("expirationDate", rest.expirationDate.toISOString());
      
      const res = await fetch(`/api/admin/licenses/${licenseId}/file`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha no upload do arquivo");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Arquivo enviado",
        description: "O arquivo da licença foi enviado com sucesso.",
      });
      setIsUploadDialogOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o arquivo da licença.",
        variant: "destructive",
      });
    },
  });

  const openStatusDialog = (license: License) => {
    setSelectedLicense(license);
    statusForm.reset({ status: license.status });
    setIsStatusDialogOpen(true);
  };

  const openUploadDialog = (license: License) => {
    setSelectedLicense(license);
    uploadForm.reset({
      licenseNumber: license.licenseNumber || "",
      issueDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    setIsUploadDialogOpen(true);
  };

  const onStatusSubmit = (values: { status: string }) => {
    if (!selectedLicense) return;
    
    updateStatusMutation.mutate({
      licenseId: selectedLicense.id,
      status: values.status,
    });
  };

  const onUploadSubmit = (values: UploadFileValues) => {
    if (!selectedLicense) return;
    
    uploadFileMutation.mutate({
      ...values,
      licenseId: selectedLicense.id,
    });
  };

  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Administração de Licenças" />
      
      <div className="flex flex-1">
        {!isMobile && <AdminSidebar />}
        
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gerenciamento de Licenças</h1>
          
            <div className="flex items-center gap-4">
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
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
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetch()}
                title="Atualizar"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
            <TableCaption>Lista de licenças no sistema</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Data de Solicitação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses && licenses.length > 0 ? (
                licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      {license.licenseNumber || `AET-${license.id}`}
                    </TableCell>
                    <TableCell>{license.setType}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusMap[license.status]?.variant || "default"}
                      >
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{`Usuário ID: ${license.userId}`}</TableCell>
                    <TableCell>
                      {format(new Date(license.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openStatusDialog(license)}
                        >
                          Alterar Status
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => openUploadDialog(license)}
                        >
                          <FileUp className="h-4 w-4 mr-1" /> 
                          Upload
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhuma licença encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </main>
      
      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Licença</DialogTitle>
            <DialogDescription>
              Atualize o status da licença {selectedLicense?.licenseNumber || `AET-${selectedLicense?.id}`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-6">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {licenseStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsStatusDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Arquivo da Licença</DialogTitle>
            <DialogDescription>
              Envie o arquivo oficial da licença {selectedLicense?.licenseNumber || `AET-${selectedLicense?.id}`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-6">
              <FormField
                control={uploadForm.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Licença (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={uploadForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Emissão</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={uploadForm.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Validade</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={uploadForm.control}
                name="licenseFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Arquivo da Licença (PDF)</FormLabel>
                    <FormControl>
                      <FileInput
                        {...fieldProps}
                        allowedTypes=".pdf,application/pdf"
                        onValueChange={(file) => onChange(file)}
                        currentFileName={value instanceof File ? value.name : ""}
                        description="Envie o arquivo PDF da licença"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={uploadFileMutation.isPending}
                >
                  {uploadFileMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}