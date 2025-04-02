import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  
  // Redirect to home if already authenticated
  if (!isLoading && user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background p-4">
      <Link href="/">
        <div className="flex items-center justify-center mb-6 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <h1 className="text-3xl font-bold ml-2 text-primary font-quicksand">Talkio</h1>
        </div>
      </Link>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8">
        {children}
      </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Talkio - A fun, safe, and interactive messaging app for families and friends</p>
        <p className="mt-1">© {new Date().getFullYear()} Talkio. All rights reserved.</p>
      </footer>
    </div>
  );
}
