// components/templates/ModernTemplate.tsx
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

export default function ModernTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="modern-container">
      <style jsx>{`
        .modern-container {
          display: grid;
          grid-template-columns: 320px 1fr;
          min-height: 100vh;
          background: white;
          font-family: Arial, sans-serif;
        }

        .sidebar {
          background: linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 50px 35px;
        }

        .profile-section {
          text-align: center;
          margin-bottom: 40px;
        }

        .name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
          line-height: 1.2;
        }

        .job-title {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }

        .sidebar-section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }

        .sidebar-title {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(255,255,255,0.3);
        }

        .contact-item {
          font-size: 12px;
          margin-bottom: 12px;
          word-break: break-word;
        }

        .skill-item {
          background: rgba(255,255,255,0.15);
          padding: 8px 12px;
          border-radius: 5px;
          font-size: 12px;
          margin-bottom: 8px;
          display: inline-block;
          margin-right: 5px;
        }

        .edu-item {
          margin-bottom: 20px;
        }

        .edu-degree {
          font-size: 13px;
          font-weight: bold;
        }

        .edu-school {
          font-size: 11px;
          margin-top: 5px;
          opacity: 0.9;
        }

        .edu-date {
          font-size: 11px;
          margin-top: 3px;
          opacity: 0.8;
        }

        .main-content {
          padding: 50px 45px;
          background: white;
        }

        .section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 22px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #3b82f6;
        }

        .summary-text {
          font-size: 14px;
          line-height: 1.7;
          color: #333;
        }

        .experience-item {
          margin-bottom: 25px;
          padding-left: 20px;
          border-left: 3px solid #3b82f6;
          page-break-inside: avoid;
        }

        .exp-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e3a8a;
        }

        .exp-company {
          font-size: 14px;
          color: #3b82f6;
          margin-top: 3px;
        }

        .exp-dates {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin-top: 3px;
        }

        .experience-item ul {
          margin-left: 20px;
          margin-top: 10px;
        }

        .experience-item li {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 6px;
          color: #444;
        }

        .project-item {
          margin-bottom: 20px;
          padding-left: 15px;
          border-left: 2px solid #3b82f6;
        }

        .project-name {
          font-size: 15px;
          font-weight: bold;
          color: #1e3a8a;
        }

        .project-desc {
          font-size: 13px;
          color: #444;
          margin-top: 5px;
          line-height: 1.5;
        }

        .project-tech {
          font-size: 11px;
          color: #666;
          margin-top: 5px;
        }

        @media print {
          .modern-container {
            display: grid;
          }
          .sidebar {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <div className="profile-section">
          <div className="name">{data.personal.name}</div>
          {data.personal.title && <div className="job-title">{data.personal.title}</div>}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Contact</div>
          <div className="contact-item">
            <span>{data.personal.email}</span>
          </div>
          <div className="contact-item">
            <span>{data.personal.phone}</span>
          </div>
          <div className="contact-item">
            <span>{data.personal.location}</span>
          </div>
          {data.personal.linkedin && (
            <div className="contact-item">
              <span>{data.personal.linkedin}</span>
            </div>
          )}
          {data.personal.github && (
            <div className="contact-item">
              <span>{data.personal.github}</span>
            </div>
          )}
          {data.personal.website && (
            <div className="contact-item">
              <span>{data.personal.website}</span>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Skills</div>
          {data.skills.languages.map((skill, idx) => (
            <div key={`lang-${idx}`} className="skill-item">{skill}</div>
          ))}
          {data.skills.frameworks.map((skill, idx) => (
            <div key={`fw-${idx}`} className="skill-item">{skill}</div>
          ))}
          {data.skills.tools.map((skill, idx) => (
            <div key={`tool-${idx}`} className="skill-item">{skill}</div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Education</div>
          {data.education.map((edu, idx) => (
            <div key={idx} className="edu-item">
              <div className="edu-degree">{edu.degree}</div>
              <div className="edu-school">{edu.school}</div>
              <div className="edu-date">{edu.graduationDate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="main-content">
        <div className="section">
          <div className="section-title">Professional Summary</div>
          <p className="summary-text">{data.summary}</p>
        </div>

        <div className="section">
          <div className="section-title">Experience</div>
          {data.experience.map((job, idx) => (
            <div key={idx} className="experience-item">
              <div className="exp-title">{job.title}</div>
              <div className="exp-company">{job.company} • {job.location}</div>
              <div className="exp-dates">{job.startDate} - {job.endDate}</div>
              <ul>
                {job.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {data.projects && data.projects.length > 0 && (
          <div className="section">
            <div className="section-title">Projects</div>
            {data.projects.map((project, idx) => (
              <div key={idx} className="project-item">
                <div className="project-name">{project.name}</div>
                <div className="project-desc">{project.description}</div>
                <div className="project-tech">
                  <strong>Technologies:</strong> {project.technologies.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
