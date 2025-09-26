import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPatientDetails, getPatientCommunications, getPatientAppointments, getPatientDocuments,
  updateLeadStatus, getSignedDownloadUrl, getPatientFinancials, acquireLeadLock, releaseLeadLock, getDisputes, getCallLogs, updateDisputeStatus
} from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Calendar, FileText, MessageSquare, Download, Edit, PlusCircle, BrainCircuit, Upload, CreditCard, Lock, Target, AlertTriangle, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { LeadStatus, LockStatus, Dispute } from "@shared/types";
import { toast } from "sonner";
import { UploadDocumentDialog } from "@/components/UploadDocumentDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { AddDisputeDialog } from "@/components/AddDisputeDialog";
import { useAuthStore } from "@/lib/auth";
import { Banner } from "@/components/ui/banner";
import { motion, AnimatePresence } from "framer-motion";
const leadStatuses: LeadStatus[] = [
  "New", "Contacted", "Qualified", "Consultation Scheduled", "Treatment Proposed", "Treatment Started",
];
const disputeStatuses: Dispute['status'][] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [activeTab, setActiveTab] = useState("communications");
  useEffect(() => {
    if (id && user) {
      const lockData = { userId: user.email, userName: user.name };
      acquireLeadLock(id, lockData).then(setLockStatus).catch(err => setLockStatus(err));
      const handleBeforeUnload = () => releaseLeadLock(id, { userId: user.email });
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        releaseLeadLock(id, { userId: user.email });
      };
    }
  }, [id, user]);
  const isLockedByOther = lockStatus?.locked && lockStatus.userId !== user?.email;
  const patientQuery = useQuery({ queryKey: ["patient", id], queryFn: () => getPatientDetails(id!), enabled: !!id });
  const disputesQuery = useQuery({ queryKey: ["disputes", id], queryFn: () => getDisputes(id!), enabled: !!id });
  const statusMutation = useMutation({
    mutationFn: (data: { id: string; status: LeadStatus; userId: string }) => updateLeadStatus(data),
    onSuccess: (updatedPatient) => {
      toast.success(`Status updated to ${updatedPatient.status}`);
      queryClient.setQueryData(["patient", id], updatedPatient);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(`Failed to update status: ${error.message}`),
  });
  const disputeStatusMutation = useMutation({
    mutationFn: (data: { disputeId: string; status: Dispute['status'] }) => {
        if (!user) throw new Error("User not authenticated");
        return updateDisputeStatus(data.disputeId, { status: data.status, user: user.name });
    },
    onSuccess: () => {
        toast.success("Dispute status updated.");
        queryClient.invalidateQueries({ queryKey: ["disputes", id] });
    },
    onError: (error) => toast.error(`Failed to update dispute: ${error.message}`),
  });
  const handleStatusChange = (status: LeadStatus) => {
    if (id && user) statusMutation.mutate({ id, status, userId: user.email });
  };
  const handleDisputeStatusChange = (disputeId: string, status: Dispute['status']) => {
    disputeStatusMutation.mutate({ disputeId, status });
  };
  const patient = patientQuery.data;
  if (patientQuery.isLoading) return <PatientDetailSkeleton />;
  if (patientQuery.isError) return <div className="text-center py-10 text-red-500">Error: {patientQuery.error.message}</div>;
  if (!patient) return <div className="text-center py-10">Patient not found.</div>;
  return (
    <>
      {id && <UploadDocumentDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} patientId={id} />}
      {id && <RecordPaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} patientId={id} />}
      {id && <AddDisputeDialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen} patientId={id} />}
      <div className="space-y-8 animate-fade-in">
        {isLockedByOther && (
          <Banner icon={<Lock className="h-5 w-5" />} title="Record Locked" variant="warning">
            This record is currently being edited by {lockStatus?.userName}. You are in read-only mode.
          </Banner>
        )}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary"><AvatarImage src={patient.avatarUrl} alt={patient.name} /><AvatarFallback className="text-3xl">{patient.name.charAt(0)}</AvatarFallback></Avatar>
            <div>
              <h1 className="text-4xl font-bold font-display">{patient.name}</h1>
              <p className="text-muted-foreground">Patient ID: {patient.patientId}</p>
              <div className="mt-2">
                <Select value={patient.status} onValueChange={handleStatusChange} disabled={statusMutation.isPending || isLockedByOther}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Change status..." /></SelectTrigger>
                  <SelectContent>{leadStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="communications">Notes</TabsTrigger>
                <TabsTrigger value="calls">Calls</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  {activeTab === 'disputes' && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Dispute History</CardTitle>
                        <Button size="sm" onClick={() => setIsDisputeOpen(true)} disabled={isLockedByOther}><AlertTriangle className="mr-2 h-4 w-4" /> File a Dispute</Button>
                      </CardHeader>
                      <CardContent>
                        {disputesQuery.isLoading ? <Skeleton className="h-40 w-full" /> : disputesQuery.data?.length === 0 ? <div className="text-center py-10 text-muted-foreground">No disputes filed for this patient.</div> :
                        <div className="space-y-4">
                          {disputesQuery.data?.map((dispute, index) =>
                            <motion.div key={dispute.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                              <Card className="bg-muted/50">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{dispute.subject}</CardTitle>
                                    <Select value={dispute.status} onValueChange={(newStatus) => handleDisputeStatusChange(dispute.id, newStatus as Dispute['status'])} disabled={disputeStatusMutation.isPending}>
                                      <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {disputeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Filed by {dispute.created_by} {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}</p>
                                </CardHeader>
                                <CardContent><p className="text-sm">{dispute.description}</p></CardContent>
                              </Card>
                            </motion.div>
                          )}
                        </div>}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
      </div>
    </>
  );
}
function PatientDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4"><Skeleton className="h-24 w-24 rounded-full" /><div className="space-y-2"><Skeleton className="h-10 w-64" /><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-56 mt-2" /></div></div>
        <div className="flex items-center space-x-2"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-40" /></div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6"><Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card></div>
        <div className="md:col-span-2"><Skeleton className="h-10 w-full" /><Card className="mt-4"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>
      </div>
    </div>
  );
}