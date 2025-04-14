
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

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
        
        setIsBackendConnected(!error);
      } catch (error) {
        console.error("Backend connection check failed:", error);
        setIsBackendConnected(false);
      }
    };

    // Get the current session
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setIsLoading(false);
    };

    // Run both connection check and session retrieval
    Promise.all([checkBackendConnection(), getSession()]);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
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
