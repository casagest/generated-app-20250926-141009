import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEscrowRule } from "@/lib/api";
import { toast } from "sonner";
const escrowRuleSchema = z.object({
  clinic_share_percentage: z.coerce.number().min(0, "Must be at least 0").max(100, "Must be at most 100"),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  end_date: z.string().optional().nullable(),
});
type EscrowRuleFormData = z.infer<typeof escrowRuleSchema>;
export function EscrowRuleForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<EscrowRuleFormData>({
    resolver: zodResolver(escrowRuleSchema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      clinic_share_percentage: 88,
    },
  });
  const clinicShare = watch("clinic_share_percentage");
  const agencyShare = 100 - (Number(clinicShare) || 0);
  const mutation = useMutation({
    mutationFn: createEscrowRule,
    onSuccess: () => {
      toast.success("New escrow rule created and activated!");
      queryClient.invalidateQueries({ queryKey: ["escrowRules"] });
      reset();
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });
  const onSubmit = (data: EscrowRuleFormData) => {
    const payload = {
      ...data,
      agency_share_percentage: 100 - data.clinic_share_percentage,
      end_date: data.end_date || null,
    };
    mutation.mutate(payload);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Escrow Rule</CardTitle>
        <CardDescription>
          This new rule will become active immediately and deactivate the previous one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinic_share_percentage">Clinic Share (%)</Label>
              <Input id="clinic_share_percentage" type="number" {...register("clinic_share_percentage")} />
              {errors.clinic_share_percentage && <p className="text-red-500 text-xs mt-1">{errors.clinic_share_percentage.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency_share_percentage">Agency Share (%)</Label>
              <Input id="agency_share_percentage" type="number" value={agencyShare} readOnly disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save and Activate Rule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}