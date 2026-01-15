"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PortfolioTemplate } from "@/components/PortfolioTemplate";

interface PortfolioData {
  user_id: string;
  name: string;
  email: string;
  location: string;
  bio: string;
  links: Array<{ id: string; type: string; value: string }>;
  skills: Array<{ id: string; name: string }>;
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string;
    link?: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
  }>;
  interests: Array<{ id: string; name: string }>;
  design_type?: string;
}

export default function DeployedPortfolio() {
  const params = useParams();
  const userId = params.userId as string;
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/portfolio/${userId}/data`);
        if (!response.ok) {
          throw new Error("Portfolio not found");
        }
        const portfolioData = await response.json();
        setData(portfolioData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a7fff]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Portfolio Not Found</h1>
          <p className="text-muted-foreground">{error || "This portfolio does not exist or has not been deployed."}</p>
        </div>
      </div>
    );
  }

  const designType = (data.design_type || "terminal") as "terminal" | "minimal" | "professional";

  return (
    <div className="min-h-screen bg-background">
      <PortfolioTemplate data={data} isPreview={false} designType={designType} />
    </div>
  );
}
