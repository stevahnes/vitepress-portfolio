import { Resume } from '../../../models';

export const SAMPLE_RESUME: Resume = {
  header: {
    name: 'Stevanus SATRIA',
    subtitle: 'CSPO® | CSM® | ICP-ATF | ICP-ACC',
    email: 'stevanus.satria@gmail.com',
    phone: '(65) 8366 8579',
    leftDetail: 'www.stevanussatria.com',
    rightDetail: 'www.linkedin.com/in/stevanussatria'
  },
  profile:
    'Agile proactive Business Analyst and Full-Stack Engineer with 4+ years of experience in requirements and data analysis, solution refinement, and engineering of Software as a Service (SaaS) products. Successfully launched key product features, innovative pilots, and provided production support to global clients. Certified ScrumMaster, Product Owner, Agile Facilitator, and Agile Coach who is also proficient in modern software development stack, popular issue tracking tool, and industry-standard UI design application. Fluent in English, Bahasa Indonesia, Malay, and basic conversational Chinese.',
  competencies: [
    'AngularJS',
    'JavaScript',
    'Typescript',
    'SQL',
    'Python',
    'Java',
    'Jasmine',
    'HTML',
    'CSS',
    'Git',
    'npm',
    'MATLAB',
    'Postman',
    'Figma',
    'Agile',
    'Scrum',
    'Product backlog management',
    'Design thinking',
    'Project management',
    'JIRA',
    'Confluence',
    'ScriptRunner'
  ],
  work: [
    {
      company: 'AMADEUS IT GROUP',
      location: 'Singapore',
      designations: [
        {
          title: 'System Analyst (Software Engineer)',
          start: 'April 2020',
          end: '',
          descriptions: ['']
        },
        {
          title: 'Amadeus IT Graduate (Technical Business Analyst)',
          start: 'July 2018',
          end: 'March 2020',
          descriptions: ['']
        }
      ],
      descriptions: [
        'Developed key features for three modules within our SaaS-based Airport Management Suite using frameworks.',
        'Launched cross-functional biometric initiative pilot in 2019 with Ljubljana Airport, attaining a 75% success rate.',
        'Automated unit testing using Jasmine/Junit and UI Team’s design process with coded plugins, now with 3000+ installs.',
        'Redesigned our SaaS-based airport map UI following the industry standard to support up to 5x more data on the viewport.',
        'Analyzed post-release statistics and highlighted key takeaways to global senior management for continuous improvement.'
      ]
    },
    {
      company: 'works applications co., ltd.',
      location: 'Singapore',
      designations: [
        { title: 'Software Engineer', start: 'October 2017', end: 'June 2018', descriptions: [''] }
      ],
      descriptions: [
        'Implemented new features of a mobile application for human resource management in plain JavaScript.',
        'Designed various ways to improve application usability and reduce user input using InVision..',
        'Collaborated with regional product and quality assurance teams throughout the release cycle'
      ]
    },
    {
      company: 'singapore university of technology and design',
      location: 'Singapore',
      designations: [
        {
          title: 'Research Officer',
          start: 'October 2016',
          end: 'September 2017',
          descriptions: ['']
        }
      ],
      descriptions: [
        'Published a novel open-loop control algorithm for improved locomotion of spherical rolling robots.',
        'Implemented and fine-tuned a new dead-reckoning localization algorithm specifically for VIRGO.',
        'Validated experimental data using MATLAB, and designed mechanical improvements using SOLIDWORKS.'
      ]
    }
  ],
  education: [
    {
      institution: 'SINGAPORE UNIVERSITY OF TECHNOLOGY AND DESIGN',
      qualification: ['Bachelor of Engineering (Product Development)'],
      start: 'May 2013',
      end: 'September 2016',
      honorsAndGrade: 'Summa Cum Laude, CGPA: 4.96/5.00'
    },
    {
      institution: 'catholic junior college',
      qualification: ['Singapore-Cambridge GCE A-Level'],
      start: 'January 2011',
      end: 'December 2012',
      honorsAndGrade: 'H3 Essentials of Modern Physics, UAS: 90/90'
    }
  ],
  awardsAndCertifications: [
    {
      name: 'Software Product Management Specialization by University of Alberta (Coursera)',
      acquiredDate: 'December 2020'
    },
    {
      name:
        'Certified Scrum Product Owner® & ICAgile™ Certified Professional – Agile Team Facilitation',
      acquiredDate: 'December 2020'
    },
    {
      name: 'Certified ScrumMaster® & ICAgile™ Certified Professional – Agile Coaching',
      acquiredDate: 'November 2020'
    },
    { name: 'SG Mark', acquiredDate: 'March 2017' },
    {
      name: 'IES Gold Medal & Keppel Award of Excellence (Senior Year)',
      acquiredDate: 'September 2016'
    },
    { name: 'Keppel Award of Excellence (Junior Year)', acquiredDate: 'March 2016' },
    { name: 'Di Yerbury International Scholars Award', acquiredDate: 'July 2014' },
    { name: 'Tay Chen Hui Memorial Award', acquiredDate: 'July 2013' },
    { name: 'ASEAN Undergraduate Scholarship', acquiredDate: 'May 2013' },
    { name: 'Ministry of Education School-based Scholarship', acquiredDate: 'November 2008' }
  ]
};
