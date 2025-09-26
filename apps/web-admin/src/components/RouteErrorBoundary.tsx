import { useRouteError } from "react-router-dom";
export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return <div>An unexpected error has occurred.</div>;
}