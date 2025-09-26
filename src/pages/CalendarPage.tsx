import React, { useState, useMemo } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/lib/types";
import { format, isSameDay, parseISO } from "date-fns";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { getAppointments } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
export function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data: appointments, isLoading, isError, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });
  const selectedDayAppointments = useMemo(() => {
    if (!date || !appointments) return [];
    return appointments
      .filter((appointment) => isSameDay(parseISO(appointment.startTime), date))
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
  }, [date, appointments]);
  if (isError) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold font-display">Calendar</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Appointments for {date ? format(date, "MMMM d, yyyy") : "..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh]">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <div className="flex flex-col items-center space-y-1">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDayAppointments.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayAppointments.map((appt) => (
                    <div key={appt.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                      <div className="flex flex-col items-center">
                        <p className="font-semibold">{format(parseISO(appt.startTime), "h:mm a")}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(appt.endTime), "h:mm a")}</p>
                      </div>
                      <div className="w-1 h-full bg-primary rounded-full" style={{backgroundColor: `var(--${appt.type === 'Treatment' ? 'chart-2' : 'primary'})`}}></div>
                      <div className="flex-1">
                        <p className="font-bold">{appt.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appt.doctor}</p>
                        <div className="mt-2 flex gap-2">
                           <Badge variant="secondary">{appt.type}</Badge>
                           <Badge variant={appt.status === 'Completed' ? 'default' : 'outline'}>{appt.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No appointments scheduled for this day.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}