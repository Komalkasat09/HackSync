// components/templates/CoverLetterTemplate.tsx
import React from 'react';

interface CoverLetterData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  company: string;
  jobTitle: string;
  greeting: string;
  opening_paragraph: string;
  body_paragraphs: string[];
  closing_paragraph: string;
  signature: string;
  date: string;
}

export default function CoverLetterTemplate({ data }: { data: CoverLetterData }) {
  return (
    <div className="cover-letter">
      <style jsx>{`
        .cover-letter {
          font-family: Georgia, serif;
          color: #000;
          background: #fff;
          padding: 60px 80px;
          max-width: 850px;
          margin: 0 auto;
          min-height: 100vh;
          line-height: 1.6;
        }

        .header {
          margin-bottom: 30px;
        }

        .sender-info {
          margin-bottom: 20px;
        }

        .sender-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .sender-contact {
          font-size: 12px;
          color: #333;
          line-height: 1.4;
        }

        .date {
          font-size: 13px;
          margin-bottom: 25px;
          color: #555;
        }

        .recipient {
          margin-bottom: 25px;
        }

        .company-name {
          font-weight: bold;
          font-size: 14px;
        }

        .greeting {
          font-size: 14px;
          margin-bottom: 20px;
        }

        .paragraph {
          font-size: 13px;
          margin-bottom: 18px;
          text-align: justify;
        }

        .closing {
          margin-top: 30px;
        }

        .signature-line {
          font-size: 14px;
          margin-top: 40px;
        }

        @media print {
          .cover-letter {
            padding: 40px;
          }
        }
      `}</style>

      <div className="header">
        <div className="sender-info">
          <div className="sender-name">{data.personal.name}</div>
          <div className="sender-contact">
            {data.personal.email} • {data.personal.phone}
            {data.personal.location && <> • {data.personal.location}</>}
            {data.personal.linkedin && <><br />{data.personal.linkedin}</>}
          </div>
        </div>

        <div className="date">{data.date}</div>

        <div className="recipient">
          <div className="company-name">{data.company}</div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '3px' }}>
            {data.jobTitle}
          </div>
        </div>
      </div>

      <div className="greeting">{data.greeting}</div>

      <div className="paragraph">{data.opening_paragraph}</div>

      {data.body_paragraphs.map((paragraph, index) => (
        <div key={index} className="paragraph">
          {paragraph}
        </div>
      ))}

      <div className="paragraph">{data.closing_paragraph}</div>

      <div className="closing">
        <div className="signature-line">{data.signature}</div>
      </div>
    </div>
  );
}
