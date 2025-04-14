
import React from 'react';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const { isBackendConnected } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {!isBackendConnected && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Connection Issue</AlertTitle>
          <AlertDescription>
            Unable to connect to the backend. Please check your internet connection or try again later.
          </AlertDescription>
        </Alert>
      )}
      <main className="flex-grow">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
