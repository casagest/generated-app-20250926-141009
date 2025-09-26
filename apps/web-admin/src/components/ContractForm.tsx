import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContract, createContractVersion } from "@/lib/api";
import { toast } from "sonner";
import { Agency, AgencyContract } from "@shared/types";
import { useEffect } from "react";
const contractSchema = z.object({
  name: z.string().min(3, "Contract name is required."),
  agency_id: z.string().min(1, "Agency is required."),
});
const versionSchema = z.object({
  start_date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date."),
  end_date: z.string().optional(),
  settlement_logic: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Must be valid JSON."),
});
type ContractFormData = z.infer<typeof contractSchema>;
type VersionFormData = z.infer<typeof versionSchema>;
interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  contract: AgencyContract | null;
  agencies: Agency[];
}
export function ContractForm({ isOpen, onClose, contract, agencies }: ContractFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
  });
  const { register: registerVersion, handleSubmit: handleSubmitVersion, formState: { errors: versionErrors } } = useForm<VersionFormData>({
    resolver: zodResolver(versionSchema),
  });
  useEffect(() => {
    if (contract) {
      reset({ name: contract.name, agency_id: contract.agency_id });
    } else {
      reset({ name: "", agency_id: "" });
    }
  }, [contract, reset]);
  const createContractMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      toast.success("Contract created successfully.");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });
  const createVersionMutation = useMutation({
    mutationFn: (data: { contractId: string, versionData: VersionFormData }) => createContractVersion(data.contractId, data.versionData),
    onSuccess: () => {
      toast.success("New contract version created.");
      queryClient.invalidateQueries({ queryKey: ["contracts"] }); // Or a more specific key
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });
  const onContractSubmit = (data: ContractFormData) => {
    createContractMutation.mutate(data);
  };
  const onVersionSubmit = (data: VersionFormData) => {
    if (contract) {
      createVersionMutation.mutate({ contractId: contract.id, versionData: data });
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contract ? `Manage Contract: ${contract.name}` : "Create New Agency Contract"}</DialogTitle>
          <DialogDescription>
            {contract ? "View versions or create a new one." : "Define the basic details for a new contract."}
          </DialogDescription>
        </DialogHeader>
        {!contract ? (
          <form onSubmit={handleSubmit(onContractSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contract Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency_id">Agency</Label>
              <Controller
                name="agency_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select an agency" /></SelectTrigger>
                    <SelectContent>
                      {agencies.map(agency => <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.agency_id && <p className="text-sm text-red-500">{errors.agency_id.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createContractMutation.isPending}>Create Contract</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-4">Create New Version</h3>
            <form onSubmit={handleSubmitVersion(onVersionSubmit)} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" type="date" {...registerVersion("start_date")} />
                  {versionErrors.start_date && <p className="text-sm text-red-500">{versionErrors.start_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input id="end_date" type="date" {...registerVersion("end_date")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settlement_logic">Settlement Logic (JSONLogic)</Label>
                <Textarea id="settlement_logic" {...registerVersion("settlement_logic")} rows={6} placeholder='{ "var": "commission_rate" }' />
                {versionErrors.settlement_logic && <p className="text-sm text-red-500">{versionErrors.settlement_logic.message}</p>}
              </div>
              <Button type="submit" disabled={createVersionMutation.isPending}>Create New Version</Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}