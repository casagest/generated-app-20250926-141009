import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPatientDetails,
  getPatientCommunications,
  getPatientAppointments,
  getPatientDocuments,
  updateLeadStatus,
} from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail, Phone, MapPin, Calendar, FileText, MessageSquare, Download, Edit, PlusCircle, BrainCircuit,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { LeadStatus } from "@/lib/types";
import { toast } from "sonner";
const leadStatuses: LeadStatus[] = [
  "New", "Contacted", "Qualified", "Consultation Scheduled", "Treatment Proposed", "Treatment Started",
];
export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const patientQuery = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatientDetails(id!),
    enabled: !!id,
  });
  const communicationsQuery = useQuery({
    queryKey: ["communications", id],
    queryFn: () => getPatientCommunications(id!),
    enabled: !!id,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => getPatientAppointments(id!),
    enabled: !!id,
  });
  const documentsQuery = useQuery({
    queryKey: ["documents", id],
    queryFn: () => getPatientDocuments(id!),
    enabled: !!id,
  });
  const statusMutation = useMutation({
    mutationFn: updateLeadStatus,
    onSuccess: (updatedPatient) => {
      toast.success(`Status updated to ${updatedPatient.status}`);
      queryClient.setQueryData(["patient", id], updatedPatient);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
  const handleStatusChange = (status: LeadStatus) => {
    if (id) {
      statusMutation.mutate({ id, status });
    }
  };
  if (patientQuery.isLoading) {
    return <PatientDetailSkeleton />;
  }
  if (patientQuery.isError) {
    return <div className="text-center py-10 text-red-500">Error: {patientQuery.error.message}</div>;
  }
  const patient = patientQuery.data;
  if (!patient) {
    return <div className="text-center py-10">Patient not found.</div>;
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={patient.avatarUrl} alt={patient.name} />
            <AvatarFallback className="text-3xl">{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold font-display">{patient.name}</h1>
            <p className="text-muted-foreground">Patient ID: {patient.patientId}</p>
            <div className="mt-2">
              <Select value={patient.status} onValueChange={handleStatusChange} disabled={statusMutation.isPending}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {leadStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
          <Button><PlusCircle className="mr-2 h-4 w-4" /> New Appointment</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{patient.email}</span></div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{patient.phone}</span></div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{patient.address}</span></div>
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>DOB: {patient.dateOfBirth}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>Total Billed:</span> <span className="font-medium">${patient.totalBilled.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total Paid:</span> <span className="font-medium">${patient.totalPaid.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold"><span>Balance:</span> <span>${(patient.totalBilled - patient.totalPaid).toLocaleString()}</span></div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> AI: Next Best Action</CardTitle></CardHeader>
            <CardContent>
              <p className="text-primary-foreground/90">Patient has an outstanding balance. Recommend sending a payment reminder email and scheduling a follow-up call to discuss payment options.</p>
              <Button size="sm" className="mt-4">Send Reminder</Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Tabs defaultValue="communications">
            <TabsList>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
            </TabsList>
            <TabsContent value="communications" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Communication History</CardTitle></CardHeader>
                <CardContent>
                  {communicationsQuery.isLoading ? <Skeleton className="h-40 w-full" /> :
                    <div className="space-y-4">
                      {communicationsQuery.data?.map(comm => (
                        <div key={comm.id} className="flex items-start gap-3">
                          <div className="bg-muted rounded-full p-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /></div>
                          <div>
                            <p className="font-medium">{comm.type} with {comm.author}</p>
                            <p className="text-sm text-muted-foreground">{comm.summary}</p>
                            <p className="text-xs text-muted-foreground/70">{comm.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="appointments" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Appointment History</CardTitle></CardHeader>
                <CardContent>
                  {appointmentsQuery.isLoading ? <TableSkeleton columnCount={4} rowCount={5} /> :
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointmentsQuery.data?.map(appt => (
                          <TableRow key={appt.id}>
                            <TableCell>{format(new Date(appt.startTime), "yyyy-MM-dd h:mm a")}</TableCell>
                            <TableCell>{appt.type}</TableCell>
                            <TableCell>{appt.doctor}</TableCell>
                            <TableCell><Badge variant={appt.status === "Completed" ? "default" : "secondary"}>{appt.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  }
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent>
                  {documentsQuery.isLoading ? <TableSkeleton columnCount={4} rowCount={3} /> :
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentsQuery.data?.map(doc => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {doc.name}</TableCell>
                            <TableCell>{doc.type}</TableCell>
                            <TableCell>{doc.uploadDate}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  }
                </CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="treatment" className="mt-4">
                <Card>
                    <CardHeader><CardTitle>Treatment Plan</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-semibold text-lg">{patient.treatmentPlan}</p>
                        <p className="text-muted-foreground mt-2">Details about the treatment plan, progress, and next steps would be displayed here.</p>
                    </CardContent>
                </Card>
             </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
function PatientDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-56 mt-2" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-10 w-full" />
          <Card className="mt-4"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}