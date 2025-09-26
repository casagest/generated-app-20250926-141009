import { useQuery } from "@tanstack/react-query";
import { getAgencyKpis } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CardGridSkeleton } from "@/components/loaders/CardGridSkeleton";
import { Users, Target, TrendingUp, DollarSign, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
const iconMap: { [key: string]: React.ElementType } = {
  "Total Leads Generated": Users,
  "Conversion Rate": Target,
  "Cost Per Lead (CPL)": TrendingDown,
  "Total Commission Earned": DollarSign,
};
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};
export function AgencyDashboardPage() {
  const { data: kpis, isLoading, isError, error } = useQuery({
    queryKey: ["agencyKpis"],
    queryFn: getAgencyKpis,
  });
  if (isError) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  }
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold font-display">Performance Dashboard</h1>
        <p className="text-muted-foreground">Your real-time campaign performance metrics.</p>
      </motion.div>
      {isLoading ? <CardGridSkeleton /> : (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {kpis?.map((kpi) => {
            const Icon = iconMap[kpi.title] || TrendingUp;
            return (
              <motion.div key={kpi.title} variants={itemVariants}>
                <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className={cn(
                      "text-xs",
                      kpi.changeType === "increase" ? "text-emerald-500" :
                      kpi.changeType === "decrease" ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {kpi.change} from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Leads Funnel</CardTitle>
          <CardDescription>A placeholder for a detailed leads funnel visualization.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          [Funnel Chart Coming Soon]
        </CardContent>
      </Card>
    </div>
  );
}