import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import AppLayout from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { PatientDetailPage } from '@/pages/PatientDetailPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AgencyPortalPage } from '@/pages/AgencyPortalPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ChatbotPage } from '@/pages/ChatbotPage';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/leads",
            element: <LeadsPage />,
          },
          {
            path: "/patients/:id",
            element: <PatientDetailPage />,
          },
          {
            path: "/calendar",
            element: <CalendarPage />,
          },
          {
            path: "/reports",
            element: <ReportsPage />,
          },
          {
            path: "/agency",
            element: <AgencyPortalPage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
          {
            path: "/chatbot",
            element: <ChatbotPage />,
          },
          // Redirects for unimplemented pages to maintain a working demo
          { path: "/patients", element: <Navigate to="/leads" replace /> },
          { path: "/support", element: <Navigate to="/" replace /> },
        ]
      }
    ]
  },
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)