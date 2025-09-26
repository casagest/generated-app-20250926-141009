import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, File, CheckCircle, XCircle, Loader } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { initiateImport, getImportHistory } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ImportJob } from '@shared/types';
export function DataImportCard() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const { data: history, isLoading: historyLoading } = useQuery<ImportJob[]>({
    queryKey: ['importHistory'],
    queryFn: getImportHistory,
    refetchInterval: 5000, // Poll for status updates
  });
  const importMutation = useMutation({
    mutationFn: (file: File) => {
      if (!user?.email) throw new Error("User not authenticated");
      return initiateImport(file, user.email);
    },
    onSuccess: () => {
      toast.success("File uploaded successfully. Processing has started.");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['importHistory'] });
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });
  const handleImport = () => {
    if (file) {
      importMutation.mutate(file);
    }
  };
  const getStatusBadge = (status: ImportJob['status']) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary"><Loader className="mr-1 h-3 w-3 animate-spin" />Pending</Badge>;
      case 'Processing':
        return <Badge variant="outline"><Loader className="mr-1 h-3 w-3 animate-spin" />Processing</Badge>;
      case 'Completed':
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'Failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Import Leads</CardTitle>
          <CardDescription>Upload a CSV file to bulk-import new leads into the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            {file ? (
              <p className="mt-2 text-sm">Selected file: {file.name}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {isDragActive ? 'Drop the file here...' : 'Drag & drop a CSV file here, or click to select'}
              </p>
            )}
          </div>
          <Button onClick={handleImport} disabled={!file || importMutation.isPending} className="w-full">
            {importMutation.isPending ? 'Uploading...' : 'Start Import'}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Status of past and ongoing data imports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading history...</TableCell></TableRow>
              ) : (
                history?.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.file_name}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">{job.processed_rows ?? 'N/A'} / {job.total_rows ?? 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}