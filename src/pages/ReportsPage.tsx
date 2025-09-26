import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFullReportData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/loaders/CardGridSkeleton";
const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--secondary-foreground))", "hsl(var(--muted-foreground))"];
export function ReportsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fullReportData"],
    queryFn: getFullReportData,
  });
  if (isError) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  }
  const financialSummary = data?.financialSummary;
  const marketingMetrics = data?.marketingMetrics;
  const conversionFunnel = data?.conversionFunnel;
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold font-display">Reports & Analytics</h1>
      {isLoading ? <CardGridSkeleton /> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialSummary?.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-emerald-500">+15.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialSummary?.netProfit.toLocaleString()}</div>
              <p className="text-xs text-emerald-500">+18.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customer Acquisition Cost (CAC)</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${marketingMetrics?.cac.toFixed(2)}</div>
              <p className="text-xs text-emerald-500">-5.4% from last month (Improved)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Return on Ad Spend (ROAS)</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketingMetrics?.roas.toFixed(2)}x</div>
              <p className="text-xs text-emerald-500">+8.9% from last month</p>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly P&L Summary</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialSummary?.monthlyPnl}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)", }} cursor={{ fill: 'hsl(var(--accent))' }} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--secondary-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={conversionFunnel} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} >
                      {conversionFunnel?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)", }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detailed Financials</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-24 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Revenue</TableCell>
                  <TableCell className="text-right text-emerald-500">${financialSummary?.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell>From treatments and consultations.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Expenses</TableCell>
                  <TableCell className="text-right text-red-500">${financialSummary?.totalExpenses.toLocaleString()}</TableCell>
                  <TableCell>Includes staff, rent, marketing, and supplies.</TableCell>
                </TableRow>
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Net Profit</TableCell>
                  <TableCell className="text-right">${financialSummary?.netProfit.toLocaleString()}</TableCell>
                  <TableCell>Profit before taxes.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}