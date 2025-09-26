import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSignUploadUrl, uploadFileToR2, createDocumentRecord } from "@/lib/api";
import { toast } from "sonner";
import { Document } from "@shared/types";
import { Progress } from "@/components/ui/progress";
const docTypes: Document['type'][] = ["X-Ray", "Treatment Plan", "Invoice", "Consent Form"];
const uploadSchema = z.object({
  type: z.enum(docTypes),
  file: z.instanceof(FileList).refine((files) => files.length > 0, "File is required."),
});
type UploadFormData = z.infer<typeof uploadSchema>;
interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}
export function UploadDocumentDialog({ open, onOpenChange, patientId }: UploadDocumentDialogProps) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });
  const mutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const file = data.file[0];
      if (!file) throw new Error("No file selected");
      setUploadProgress(10);
      // 1. Get signed URL from our backend
      const { url, key } = await getSignUploadUrl({
        filename: file.name,
        contentType: file.type,
        patientId,
      });
      setUploadProgress(30);
      // 2. Upload file directly to R2
      const uploadResponse = await uploadFileToR2(url, file);
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to R2.");
      }
      setUploadProgress(70);
      // 3. Create document record in our database
      await createDocumentRecord(patientId, {
        name: file.name,
        type: data.type,
        url: key, // Store the object key, not the full URL
      });
      setUploadProgress(100);
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      onOpenChange(false);
      reset();
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    },
  });
  const onSubmit = (data: UploadFormData) => {
    mutation.mutate(data);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Select a file and document type to upload for this patient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">File</Label>
            <div className="col-span-3">
              <Input id="file" type="file" {...register("file")} disabled={mutation.isPending} />
              {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <div className="col-span-3">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mutation.isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {docTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>
          </div>
          {mutation.isPending && (
            <div className="col-span-4 px-1">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground mt-1">Uploading...</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}