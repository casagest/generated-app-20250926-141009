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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDispute } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth";
const disputeSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
});
type DisputeFormData = z.infer<typeof disputeSchema>;
interface AddDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}
export function AddDisputeDialog({ open, onOpenChange, patientId }: AddDisputeDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
  });
  const mutation = useMutation({
    mutationFn: (data: DisputeFormData) => {
      if (!user) throw new Error("User not authenticated.");
      return createDispute(patientId, { ...data, created_by: user.name });
    },
    onSuccess: () => {
      toast.success("Dispute filed successfully!");
      queryClient.invalidateQueries({ queryKey: ["disputes", patientId] });
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      toast.error(`Failed to file dispute: ${error.message}`);
    },
  });
  const onSubmit = (data: DisputeFormData) => {
    mutation.mutate(data);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>File a New Dispute</DialogTitle>
          <DialogDescription>
            Provide details about the issue. A case manager will be assigned to review it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register("subject")} />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={5} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}