import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getKpiHistory, exportKpiReport } from "@/lib/api";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { DateRange } from "react-day-picker";
import { addDays, format, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
export function KpiReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kpiHistory", date],
    queryFn: () => getKpiHistory({
      startDate: format(date!.from!, 'yyyy-MM-dd'),
      endDate: format(date!.to!, 'yyyy-MM-dd'),
    }),
    enabled: !!date?.from && !!date?.to,
  });
  const exportMutation = useMutation({
    mutationFn: exportKpiReport,
    onSuccess: (data) => {
      toast.success("Export successful! Your download will begin shortly.");
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });
  const handleExport = () => {
    if (date?.from && date?.to) {
      exportMutation.mutate({
        startDate: format(date.from, 'yyyy-MM-dd'),
        endDate: format(date.to, 'yyyy-MM-dd'),
      });
    } else {
      toast.warning("Please select a date range to export.");
    }
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold font-display">Daily KPI History</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={6} />
          ) : isError ? (
            <div className="text-center py-10 text-red-500">Error: {error.message}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">New Leads</TableHead>
                  <TableHead className="text-right">Consultations</TableHead>
                  <TableHead className="text-right">Treatments Started</TableHead>
                  <TableHead className="text-right">Conversion Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">{format(new Date(row.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">{row.new_leads}</TableCell>
                    <TableCell className="text-right">{row.consultations_scheduled}</TableCell>
                    <TableCell className="text-right">{row.treatments_started}</TableCell>
                    <TableCell className="text-right font-semibold">{row.conversion_rate.toFixed(2)}%</TableCell>
                    <TableCell className="text-right text-emerald-600">${row.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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