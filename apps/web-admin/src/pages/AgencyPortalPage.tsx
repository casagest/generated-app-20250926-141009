import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Agency, Lead } from "@shared/types";
import { Users, Target, TrendingUp, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getAgencies, getLeads } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/loaders/CardGridSkeleton";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
export function AgencyPortalPage() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | undefined>();
  const agenciesQuery = useQuery<Agency[]>({
    queryKey: ["agencies"],
    queryFn: getAgencies,
  });
  const leadsQuery = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: getLeads,
  });
  useEffect(() => {
    if (agenciesQuery.data && agenciesQuery.data.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agenciesQuery.data[0].id);
    }
  }, [agenciesQuery.data, selectedAgencyId]);
  const selectedAgency = agenciesQuery.data?.find((a) => a.id === selectedAgencyId);
  const agencyLeads = leadsQuery.data?.filter(
    (lead) => lead.source === selectedAgency?.primarySource
  ) || [];
  const handleAgencyChange = (agencyId: string) => {
    setSelectedAgencyId(agencyId);
  };
  if (agenciesQuery.isError) return <div className="text-red-500">Error: {agenciesQuery.error.message}</div>;
  if (leadsQuery.isError) return <div className="text-red-500">Error: {leadsQuery.error.message}</div>;
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold font-display">Agency Portal</h1>
        {agenciesQuery.isLoading ? <Skeleton className="h-10 w-[280px]" /> : (
          <Select value={selectedAgencyId} onValueChange={handleAgencyChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an agency" />
            </SelectTrigger>
            <SelectContent>
              {agenciesQuery.data?.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {agenciesQuery.isLoading || !selectedAgency ? <CardGridSkeleton /> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads Generated</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedAgency.totalLeads}</div>
              <p className="text-xs text-muted-foreground">All-time leads from this agency</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedAgency.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Leads to Treatment Started</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cost Per Lead</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${selectedAgency.costPerLead.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Average across all campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${selectedAgency.totalCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Based on converted leads</p>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Lead Performance</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              {agenciesQuery.isLoading || !selectedAgency ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedAgency.monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)", }} cursor={{ fill: "hsl(var(--accent))" }} />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads from {selectedAgency?.name || "..."}</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsQuery.isLoading ? <TableSkeleton columnCount={3} rowCount={5} /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyLeads.slice(0, 5).map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                      <TableCell><Badge variant={lead.aiScore > 70 ? "default" : "secondary"}>{lead.aiScore}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}