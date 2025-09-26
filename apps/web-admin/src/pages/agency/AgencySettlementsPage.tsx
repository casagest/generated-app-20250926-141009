import { useQuery } from "@tanstack/react-query";
import { getAgencySettlements } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
export function AgencySettlementsPage() {
  const { data: settlements, isLoading, isError, error } = useQuery({
    queryKey: ["agencySettlements"],
    queryFn: getAgencySettlements,
  });
  if (isError) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-display">Settlements</h1>
          <p className="text-muted-foreground">Your history of monthly payouts and performance calculations.</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton columnCount={6} /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead className="text-right">Base Commission</TableHead>
                  <TableHead className="text-right">Adjustments</TableHead>
                  <TableHead className="text-right">Total Payout</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{format(new Date(s.period_start), 'MMMM yyyy')}</TableCell>
                    <TableCell>{s.contract_name} (v{s.version_number})</TableCell>
                    <TableCell className="text-right">${s.base_commission.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${(s.bonus_amount - s.penalty_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-primary">${s.total_payout.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={s.status === 'Paid' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}