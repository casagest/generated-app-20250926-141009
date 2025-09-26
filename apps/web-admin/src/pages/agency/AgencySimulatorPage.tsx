import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgencyContractLogic } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import jsonLogic from 'json-logic-js';
export function AgencySimulatorPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agencyContractLogic"],
    queryFn: getAgencyContractLogic,
  });
  const [leads, setLeads] = useState(100);
  const [revenuePerLead, setRevenuePerLead] = useState(500);
  const [commission, setCommission] = useState(0);
  useEffect(() => {
    if (data?.logic) {
      const performanceData = {
        leads_generated: leads,
        total_revenue_generated: leads * revenuePerLead,
      };
      try {
        const result = jsonLogic.apply(data.logic, performanceData);
        setCommission(result);
      } catch (e) {
        console.error("Error applying JSONLogic:", e);
        setCommission(0);
      }
    }
  }, [leads, revenuePerLead, data]);
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold font-display">"What-If" Simulator</h1>
        <p className="text-muted-foreground">Estimate your potential earnings based on your active contract.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Inputs</CardTitle>
              <CardDescription>Adjust the sliders to see how performance affects your payout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Leads Generated</Label>
                  <span className="font-bold">{leads}</span>
                </div>
                <Slider defaultValue={[100]} max={500} step={10} onValueChange={([val]) => setLeads(val)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Average Revenue per Lead</Label>
                  <span className="font-bold">${revenuePerLead}</span>
                </div>
                <Slider defaultValue={[500]} max={2000} step={50} onValueChange={([val]) => setRevenuePerLead(val)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Contract Logic</CardTitle>
              <CardDescription>This is the JSONLogic rule currently used for your settlements.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-24 w-full" /> : isError ? <p className="text-red-500">{error.message}</p> :
                <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                  <code>{JSON.stringify(data?.logic, null, 2)}</code>
                </pre>
              }
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Estimated Payout</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-5xl font-bold text-primary">${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-muted-foreground mt-2">Based on current inputs.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}