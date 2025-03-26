import { useState, useEffect } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Vehicle, state, licenseSetTypes, insertLicenseSchema } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { states } from "@shared/schema";

// Create schema for form
const licenseRequestSchema = insertLicenseSchema.extend({
  // Override the states array to be a record of state -> boolean for checkbox handling
  states: z.record(z.string(), z.boolean()).refine(
    (states) => Object.values(states).some((selected) => selected),
    {
      message: "Selecione pelo menos um estado",
    }
  ),
});

type LicenseRequestFormValues = z.infer<typeof licenseRequestSchema>;

interface LicenseRequestFormProps {
  licenseToEdit?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LicenseRequestForm({ licenseToEdit, onSuccess, onCancel }: LicenseRequestFormProps) {
  const { toast } = useToast();
  const [showVehicleFields, setShowVehicleFields] = useState<string | null>(null);

  // Get vehicles for dropdown options
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Filter vehicles by type
  const getVehiclesByType = (type: string) => {
    return vehicles.filter(v => v.vehicleType.includes(type));
  };

  const tractorUnits = getVehiclesByType("Unidade Tratora");
  const semitrailers = getVehiclesByType("Semirreboque");
  const dollies = getVehiclesByType("Dolly");
  const flatbeds = getVehiclesByType("Prancha");

  // Initialize form with default values or loaded license data
  const getDefaultStates = () => {
    const stateValues: Record<string, boolean> = {};
    
    if (licenseToEdit?.states) {
      // If we have existing states from license to edit
      states.forEach(stateCode => {
        stateValues[stateCode] = licenseToEdit.states.includes(stateCode);
      });
    } else {
      // Default all to false
      states.forEach(stateCode => {
        stateValues[stateCode] = false;
      });
    }
    
    return stateValues;
  };

  const defaultValues: Partial<LicenseRequestFormValues> = {
    setType: licenseToEdit?.setType || "",
    primaryVehicleId: licenseToEdit?.primaryVehicleId || 0,
    firstTrailerId: licenseToEdit?.firstTrailerId || 0,
    dollyId: licenseToEdit?.dollyId || 0,
    secondTrailerId: licenseToEdit?.secondTrailerId || 0,
    setLength: licenseToEdit?.setLength || "",
    states: getDefaultStates(),
    isDraft: licenseToEdit?.isDraft !== undefined ? licenseToEdit.isDraft : true,
    status: licenseToEdit?.status || "Pendente Cadastro",
    userId: 0, // Will be set on the server
  };

  const form = useForm<LicenseRequestFormValues>({
    resolver: zodResolver(licenseRequestSchema),
    defaultValues,
  });

  // Update vehicle fields when set type changes
  useEffect(() => {
    const setType = form.watch("setType");
    setShowVehicleFields(setType || null);
  }, [form.watch("setType")]);

  // When editing, set the initial vehicle fields
  useEffect(() => {
    if (licenseToEdit) {
      setShowVehicleFields(licenseToEdit.setType);
    }
  }, [licenseToEdit]);

  const createLicenseMutation = useMutation({
    mutationFn: async (values: LicenseRequestFormValues) => {
      // Convert states record to array of selected states
      const selectedStates = Object.entries(values.states)
        .filter(([_, selected]) => selected)
        .map(([state]) => state);

      const licenseData = {
        ...values,
        primaryVehicleId: Number(values.primaryVehicleId),
        firstTrailerId: values.firstTrailerId ? Number(values.firstTrailerId) : null,
        dollyId: values.dollyId ? Number(values.dollyId) : null,
        secondTrailerId: values.secondTrailerId ? Number(values.secondTrailerId) : null,
        states: selectedStates,
      };

      const url = licenseToEdit 
        ? `/api/licenses/${licenseToEdit.id}` 
        : "/api/licenses";
      const method = licenseToEdit ? "PUT" : "POST";
      
      const res = await apiRequest(method, url, licenseData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: form.getValues("isDraft") ? "Rascunho salvo" : "Licença solicitada",
        description: form.getValues("isDraft") 
          ? "O rascunho foi salvo com sucesso" 
          : "A solicitação de licença foi enviada com sucesso",
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

  const onSubmit = (values: LicenseRequestFormValues) => {
    createLicenseMutation.mutate(values);
  };

  const handleSaveAsDraft = () => {
    form.setValue("isDraft", true);
    form.handleSubmit(onSubmit)();
  };

  const handleSendRequest = () => {
    form.setValue("isDraft", false);
    form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="setType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Conjunto</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conjunto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {licenseSetTypes.map((type) => (
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

        {/* Rodotrem Fields */}
        {showVehicleFields?.includes("Rodotrem") && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryVehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade Tratora</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade tratora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tractorUnits.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
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
                name="firstTrailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1ª Carreta</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a 1ª carreta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semitrailers.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
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
                name="dollyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dolly</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dolly" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dollies.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
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
                name="secondTrailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2ª Carreta</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a 2ª carreta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semitrailers.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Bitrem Fields */}
        {showVehicleFields?.includes("Bitrem") && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryVehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade Tratora</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade tratora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tractorUnits.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
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
                name="firstTrailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1ª Carreta</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a 1ª carreta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semitrailers.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
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
                name="secondTrailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2ª Carreta</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a 2ª carreta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semitrailers.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Prancha Fields */}
        {showVehicleFields === "Prancha" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryVehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade Tratora</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade tratora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tractorUnits.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
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
                name="firstTrailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prancha</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prancha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flatbeds.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.licensePlate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {showVehicleFields && (
          <>
            <FormField
              control={form.control}
              name="setLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprimento do Conjunto (metros)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Estados (múltipla escolha)</FormLabel>
              <div className="border border-neutral-300 rounded-md p-4 mt-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                {states.map((stateCode) => (
                  <FormField
                    key={stateCode}
                    control={form.control}
                    name={`states.${stateCode}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {stateCode}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage>
                {form.formState.errors.states?.message}
              </FormMessage>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createLicenseMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveAsDraft}
            disabled={createLicenseMutation.isPending}
          >
            Salvar Rascunho
          </Button>
          <Button
            type="button"
            onClick={handleSendRequest}
            disabled={createLicenseMutation.isPending}
          >
            {createLicenseMutation.isPending
              ? "Enviando..."
              : "Enviar Pedido"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
