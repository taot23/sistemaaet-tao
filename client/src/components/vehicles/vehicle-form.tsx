import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileInput } from "@/components/ui/file-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertVehicleSchema, vehicleTypes } from "@shared/schema";

const vehicleFormSchema = insertVehicleSchema.extend({
  documentFile: z.instanceof(File).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  vehicleToEdit?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VehicleForm({ vehicleToEdit, onSuccess, onCancel }: VehicleFormProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const defaultValues: Partial<VehicleFormValues> = {
    licensePlate: vehicleToEdit?.licensePlate || "",
    vehicleType: vehicleToEdit?.vehicleType || "",
    weight: vehicleToEdit?.weight || 0,
    documentYear: vehicleToEdit?.documentYear || new Date().getFullYear(),
  };

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const formData = new FormData();
      formData.append("licensePlate", values.licensePlate);
      formData.append("vehicleType", values.vehicleType);
      formData.append("weight", values.weight.toString());
      formData.append("documentYear", values.documentYear.toString());
      
      if (file) {
        formData.append("document", file);
      }

      const url = vehicleToEdit 
        ? `/api/vehicles/${vehicleToEdit.id}` 
        : "/api/vehicles";
      const method = vehicleToEdit ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar veículo");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: vehicleToEdit ? "Veículo atualizado" : "Veículo cadastrado",
        description: vehicleToEdit 
          ? "O veículo foi atualizado com sucesso" 
          : "O veículo foi cadastrado com sucesso",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: VehicleFormValues) => {
    createVehicleMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa do Veículo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ABC-1234" 
                    {...field} 
                    readOnly={!!vehicleToEdit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Veículo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tara (kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano do CRLV</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder={new Date().getFullYear().toString()} 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="documentFile"
          render={() => (
            <FormItem>
              <FormLabel>Upload do CRLV (PDF/Imagem)</FormLabel>
              <FormControl>
                <FileInput
                  onValueChange={(file) => setFile(file)}
                  currentFileName={vehicleToEdit?.documentUrl?.split('/').pop()}
                  allowedTypes=".pdf,.jpg,.jpeg,.png"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={createVehicleMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createVehicleMutation.isPending}
          >
            {createVehicleMutation.isPending
              ? "Salvando..."
              : vehicleToEdit
                ? "Salvar Alterações"
                : "Salvar"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
