import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc} from "@/lib/trpc";

/**
 * ShortLinkRedirect - Redirects /e/:shortCode to /engineer/job/:token
 * 
 * This component handles short engineer links (e.g., /e/ABC12345) and redirects
 * them to the full engineer job page with the actual token.
 */
export default function ShortLinkRedirect() {
  const [, params] = useRoute("/e/:shortCode");
  const [, setLocation] = useLocation();
  
  const shortCode = params?.shortCode;
  
  // Query to get the full engineer token from the short code
  const { data: job, isLoading, error } = trpc.jobs.getByShortCode.useQuery(
    { shortCode: shortCode! },
    { enabled: !!shortCode, retry: false }
  );

  useEffect(() => {
    if (job?.engineerToken) {
      // Redirect to the full engineer job page
      setLocation(`/engineer/job/${job.engineerToken}`);
    }
  }, [job, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">
            This engineer link is invalid or has expired. Please contact the supplier for a new link.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
