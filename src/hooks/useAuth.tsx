
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isBackendConnected: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isBackendConnected: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    // Check backend connectivity
    const checkBackendConnection = async () => {
      try {
        // Simple ping to Supabase to check connectivity
        const { data, error } = await supabase
          .from('menu_items')
          .select('id')
          .limit(1);
        
        const wasConnected = isBackendConnected;
        const isNowConnected = !error;
        
        setIsBackendConnected(isNowConnected);
        
        // Show toast notification when connection status changes
        if (wasConnected && !isNowConnected) {
          toast.error("Connection to the backend was lost");
        } else if (!wasConnected && isNowConnected) {
          toast.success("Connected to the backend");
        }
      } catch (error) {
        console.error("Backend connection check failed:", error);
        setIsBackendConnected(false);
      }
    };

    // Get the current session
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          console.log("Session retrieved:", data.session);
        } else if (error) {
          console.error("Error getting session:", error);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Session retrieval error:", error);
        setIsLoading(false);
      }
    };

    // Run both connection check and session retrieval
    Promise.all([checkBackendConnection(), getSession()]);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        // Re-check backend connection on auth state change
        checkBackendConnection();
      }
    );

    // Periodic backend connectivity check
    const connectionCheckInterval = setInterval(checkBackendConnection, 30000);

    // Cleanup on unmount
    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(connectionCheckInterval);
    };
  }, [isBackendConnected]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error("Error signing out");
      } else {
        toast.success("Signed out successfully");
      }
    } catch (error) {
      console.error("Sign out exception:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      isBackendConnected,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
