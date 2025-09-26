import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lead, LeadStatus } from "@shared/types";
import { PlusCircle, FileDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeads } from "@/lib/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { AddLeadDialog } from "@/components/AddLeadDialog";
const leadStatuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Consultation Scheduled",
  "Treatment Proposed",
  "Treatment Started",
];
export function LeadsPage() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const { data: leads, isLoading, isError, error } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: getLeads,
  });
  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error.message}
      </div>
    );
  }
  return (
    <>
      <AddLeadDialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen} />
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold font-display">Leads Management</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsAddLeadOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
        <Tabs defaultValue="All">
          <TabsList>
            <TabsTrigger value="All">All</TabsTrigger>
            {leadStatuses.map((status) => (
              <TabsTrigger key={status} value={status}>
                {status}
              </TabsTrigger>
            ))}
          </TabsList>
          {isLoading ? (
            <TabsContent value="All">
              <TableSkeleton showAvatar={true} columnCount={6} />
            </TabsContent>
          ) : (
            <>
              <TabsContent value="All">
                <LeadsTable leads={leads || []} />
              </TabsContent>
              {leadStatuses.map((status) => (
                <TabsContent key={status} value={status}>
                  <LeadsTable
                    leads={(leads || []).filter((lead) => lead.status === status)}
                  />
                </TabsContent>
              ))}
            </>
          )}
        </Tabs>
      </div>
    </>
  );
}
function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Score</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-accent">
              <TableCell>
                <Link to={`/patients/${lead.id}`} className="flex items-center gap-3 group">
                  <Avatar>
                    <AvatarImage src={lead.avatarUrl} alt={lead.name} />
                    <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{lead.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={lead.aiScore > 70 ? "default" : "secondary"}
                  className="text-sm"
                >
                  {lead.aiScore}
                </Badge>
              </TableCell>
              <TableCell>{lead.source}</TableCell>
              <TableCell>{lead.assignedTo}</TableCell>
              <TableCell>{lead.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}