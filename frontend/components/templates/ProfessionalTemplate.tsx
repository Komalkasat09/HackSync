// components/templates/ProfessionalTemplate.tsx
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

export default function ProfessionalTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="professional-container">
      <style jsx>{`
        .professional-container {
          font-family: 'Calibri', 'Helvetica Neue', Arial, sans-serif;
          background: white;
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }

        .header {
          background: #1f2937;
          color: white;
          padding: 45px 55px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .name-section {
          flex: 1;
        }

        .name {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .title {
          font-size: 16px;
          font-weight: 300;
          opacity: 0.85;
          letter-spacing: 0.5px;
        }

        .contact-section {
          text-align: right;
          font-size: 13px;
          line-height: 1.8;
        }

        .contact-section a {
          color: #93c5fd;
          text-decoration: none;
        }

        .contact-item {
          opacity: 0.9;
        }

        .main-content {
          padding: 40px 55px;
        }

        .section {
          margin-bottom: 32px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #3b82f6;
        }

        .summary-text {
          font-size: 14px;
          line-height: 1.7;
          color: #374151;
        }

        .experience-item {
          margin-bottom: 22px;
          page-break-inside: avoid;
        }

        .exp-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5px;
        }

        .exp-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .exp-dates {
          font-size: 13px;
          color: #6b7280;
          white-space: nowrap;
        }

        .exp-company {
          font-size: 14px;
          color: #3b82f6;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .experience-item ul {
          margin: 0;
          padding-left: 20px;
        }

        .experience-item li {
          font-size: 13px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 4px;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .education-item {
          margin-bottom: 18px;
          page-break-inside: avoid;
        }

        .edu-degree {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 3px;
        }

        .edu-school {
          font-size: 14px;
          color: #3b82f6;
          margin-bottom: 2px;
        }

        .edu-details {
          font-size: 12px;
          color: #6b7280;
        }

        .skills-category {
          margin-bottom: 15px;
        }

        .skills-label {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .skill-tag {
          font-size: 12px;
          color: #374151;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .project-item {
          margin-bottom: 18px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
          page-break-inside: avoid;
        }

        .project-name {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .project-desc {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .project-tech {
          font-size: 11px;
          color: #6b7280;
        }

        .project-tech strong {
          color: #374151;
        }

        @media print {
          .header {
            padding: 35px 45px;
          }
          .main-content {
            padding: 30px 45px;
          }
        }
      `}</style>

      <div className="header">
        <div className="header-content">
          <div className="name-section">
            <div className="name">{data.personal.name}</div>
            {data.personal.title && <div className="title">{data.personal.title}</div>}
          </div>
          <div className="contact-section">
            <div className="contact-item">{data.personal.email}</div>
            <div className="contact-item">{data.personal.phone}</div>
            <div className="contact-item">{data.personal.location}</div>
            {data.personal.linkedin && <div className="contact-item">{data.personal.linkedin}</div>}
            {data.personal.github && <div className="contact-item">{data.personal.github}</div>}
            {data.personal.website && <div className="contact-item">{data.personal.website}</div>}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="section">
          <div className="section-title">Professional Summary</div>
          <p className="summary-text">{data.summary}</p>
        </div>

        <div className="section">
          <div className="section-title">Professional Experience</div>
          {data.experience.map((job, idx) => (
            <div key={idx} className="experience-item">
              <div className="exp-row">
                <div className="exp-title">{job.title}</div>
                <div className="exp-dates">{job.startDate} - {job.endDate}</div>
              </div>
              <div className="exp-company">{job.company} | {job.location}</div>
              <ul>
                {job.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="two-column">
          <div className="section">
            <div className="section-title">Education</div>
            {data.education.map((edu, idx) => (
              <div key={idx} className="education-item">
                <div className="edu-degree">{edu.degree}</div>
                <div className="edu-school">{edu.school}</div>
                <div className="edu-details">
                  {edu.location && `${edu.location} | `}{edu.graduationDate}
                  {edu.gpa && ` | GPA: ${edu.gpa}`}
                </div>
              </div>
            ))}
          </div>

          <div className="section">
            <div className="section-title">Technical Skills</div>
            <div className="skills-category">
              <div className="skills-label">Languages</div>
              <div className="skills-list">
                {data.skills.languages.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
            <div className="skills-category">
              <div className="skills-label">Frameworks</div>
              <div className="skills-list">
                {data.skills.frameworks.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
            <div className="skills-category">
              <div className="skills-label">Tools</div>
              <div className="skills-list">
                {data.skills.tools.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {data.projects && data.projects.length > 0 && (
          <div className="section">
            <div className="section-title">Key Projects</div>
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
