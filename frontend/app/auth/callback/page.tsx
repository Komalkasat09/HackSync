"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { API_ENDPOINTS } from "@/lib/config";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error("No session found");
        }

        // Get user info from Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("Could not get user information");
        }

        // Send the user info to your backend to create/update the user
        const requestBody = {
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          provider: "google",
          provider_user_id: user.id,
        };

        console.log("Sending to backend:", requestBody);

        const response = await fetch(API_ENDPOINTS.AUTH.GOOGLE_CALLBACK, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Backend error response:", errorData);
          const errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail || errorData);
          throw new Error(errorMessage || "Failed to authenticate with backend");
        }

        const data = await response.json();
        
        // Store the backend token
        localStorage.setItem("token", data.access_token);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        
        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-foreground/60 mb-4">{error}</p>
          <p className="text-sm text-foreground/50">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Signing you in...</h1>
        <p className="text-foreground/60">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
}
