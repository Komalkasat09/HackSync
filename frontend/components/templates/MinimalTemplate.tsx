// components/templates/MinimalTemplate.tsx
import React from 'react';

interface ResumeData {
  personal: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    location: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
}

export default function MinimalTemplate({ data }: { data: ResumeData }) {
  const allSkills = [...data.skills.languages, ...data.skills.frameworks, ...data.skills.tools];

  return (
    <div className="minimal-container">
      <style jsx>{`
        .minimal-container {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #2d2d2d;
          background: #fff;
          padding: 60px 70px;
          max-width: 850px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .header {
          margin-bottom: 40px;
        }

        .name {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 12px;
          color: #1a1a1a;
        }

        .contact-line {
          font-size: 12px;
          color: #666;
          letter-spacing: 1px;
        }

        .contact-line span {
          margin-right: 20px;
        }

        .divider {
          height: 1px;
          background: #e0e0e0;
          margin: 30px 0;
        }

        .section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #888;
          margin-bottom: 18px;
        }

        .summary-text {
          font-size: 14px;
          line-height: 1.8;
          color: #444;
          font-weight: 300;
        }

        .experience-item {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .exp-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }

        .exp-title {
          font-size: 15px;
          font-weight: 500;
          color: #1a1a1a;
        }

        .exp-dates {
          font-size: 12px;
          color: #888;
        }

        .exp-company {
          font-size: 13px;
          color: #666;
          margin-bottom: 10px;
        }

        .experience-item ul {
          margin: 0;
          padding-left: 18px;
        }

        .experience-item li {
          font-size: 13px;
          line-height: 1.7;
          color: #555;
          margin-bottom: 5px;
          font-weight: 300;
        }

        .education-item {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }

        .edu-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .edu-degree {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }

        .edu-date {
          font-size: 12px;
          color: #888;
        }

        .edu-school {
          font-size: 13px;
          color: #666;
          margin-top: 3px;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-item {
          font-size: 12px;
          color: #555;
          padding: 6px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          font-weight: 400;
        }

        .project-item {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }

        .project-name {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 5px;
        }

        .project-desc {
          font-size: 13px;
          color: #555;
          line-height: 1.6;
          font-weight: 300;
          margin-bottom: 5px;
        }

        .project-tech {
          font-size: 11px;
          color: #888;
        }

        @media print {
          .minimal-container {
            padding: 40px 50px;
          }
        }
      `}</style>

      <header className="header">
        <div className="name">{data.personal.name}</div>
        <div className="contact-line">
          <span>{data.personal.email}</span>
          <span>{data.personal.phone}</span>
          <span>{data.personal.location}</span>
          {data.personal.linkedin && <span>{data.personal.linkedin}</span>}
          {data.personal.github && <span>{data.personal.github}</span>}
          {data.personal.website && <span>{data.personal.website}</span>}
        </div>
      </header>

      <div className="divider"></div>

      <div className="section">
        <div className="section-title">Profile</div>
        <p className="summary-text">{data.summary}</p>
      </div>

      <div className="section">
        <div className="section-title">Experience</div>
        {data.experience.map((job, idx) => (
          <div key={idx} className="experience-item">
            <div className="exp-header">
              <div className="exp-title">{job.title}</div>
              <div className="exp-dates">{job.startDate} — {job.endDate}</div>
            </div>
            <div className="exp-company">{job.company} · {job.location}</div>
            <ul>
              {job.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-title">Education</div>
        {data.education.map((edu, idx) => (
          <div key={idx} className="education-item">
            <div className="edu-header">
              <div className="edu-degree">{edu.degree}</div>
              <div className="edu-date">{edu.graduationDate}</div>
            </div>
            <div className="edu-school">
              {edu.school}{edu.location && ` · ${edu.location}`}
              {edu.gpa && ` · GPA: ${edu.gpa}`}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-title">Skills</div>
        <div className="skills-list">
          {allSkills.map((skill, idx) => (
            <span key={idx} className="skill-item">{skill}</span>
          ))}
        </div>
      </div>

      {data.projects && data.projects.length > 0 && (
        <div className="section">
          <div className="section-title">Projects</div>
          {data.projects.map((project, idx) => (
            <div key={idx} className="project-item">
              <div className="project-name">{project.name}</div>
              <div className="project-desc">{project.description}</div>
              <div className="project-tech">{project.technologies.join(' · ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
