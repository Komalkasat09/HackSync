"use client";

export default function DashboardHome() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-foreground/60">Welcome to SkillSphere - Your AI Career Companion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder cards */}
        {[
          { title: "Career Paths Explored", value: "0" },
          { title: "Resumes Generated", value: "0" },
          { title: "Skills Tracked", value: "0" },
          { title: "Interview Sessions", value: "0" }
        ].map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-xl p-6 hover:border-[var(--shiny-blue)] transition-colors">
            <p className="text-sm text-foreground/60 mb-2">{stat.title}</p>
            <p className="text-3xl font-bold text-[var(--shiny-blue)]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
