import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate } from
"react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import "../../../worker/index";
import AppLayout from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { PatientDetailPage } from '@/pages/PatientDetailPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { ChatWidgetPage } from '@/pages/ChatWidgetPage';
import { UtmReportsPage } from '@/pages/UtmReportsPage';
import { KpiReportsPage } from '@/pages/KpiReportsPage';
import AgencyLayout from "@/components/layout/AgencyLayout";
import { AgencyDashboardPage } from "@/pages/agency/AgencyDashboardPage";
import { AgencySettlementsPage } from "@/pages/agency/AgencySettlementsPage";
import { AgencySimulatorPage } from "@/pages/agency/AgencySimulatorPage";
const queryClient = new QueryClient();
const router = createBrowserRouter([
{
  path: "/login",
  element: <LoginPage />,
  errorElement: <RouteErrorBoundary />
},
{
  path: "/widget",
  element: <ChatWidgetPage />,
  errorElement: <RouteErrorBoundary />
},
{
  element: <ProtectedRoute />,
  children: [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
    { path: "/", element: <DashboardPage /> },
    { path: "/leads", element: <LeadsPage /> },
    { path: "/patients/:id", element: <PatientDetailPage /> },
    { path: "/calendar", element: <CalendarPage /> },
    { path: "/reports", element: <ReportsPage /> },
    { path: "/reports/utm", element: <UtmReportsPage /> },
    { path: "/reports/kpi", element: <KpiReportsPage /> },
    { path: "/settings", element: <SettingsPage /> },
    { path: "/chatbot", element: <ChatbotPage /> },
    { path: "/patients", element: <Navigate to="/leads" replace /> },
    { path: "/support", element: <Navigate to="/" replace /> }]
  },
  {
    path: "/agency",
    element: <AgencyLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
    { index: true, element: <AgencyDashboardPage /> },
    { path: "settlements", element: <AgencySettlementsPage /> },
    { path: "simulator", element: <AgencySimulatorPage /> }]
  }]
}]
);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);