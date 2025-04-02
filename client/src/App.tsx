import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useEffect } from "react";

function Router() {
  const [location] = useLocation();
  
  // Log current route for debugging
  useEffect(() => {
    console.log("Current route:", location);
  }, [location]);

  return (
    <Switch>
      <Route path="/login">
        <AuthLayout>
          <Login />
        </AuthLayout>
      </Route>
      <Route path="/register">
        <AuthLayout>
          <Register />
        </AuthLayout>
      </Route>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/chat/:friendId">
        {(params) => <Chat friendId={parseInt(params.friendId)} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
