// ============================================================================
// PORTFOLIO KNOWLEDGE BASE
// ----------------------------------------------------------------------------
// Every fact below was copied directly from the live portfolio's own
// index.html (About / Skills / Projects / Experience / Contact sections).
// This file is the ONLY source of truth the AI assistant is allowed to use
// when answering questions about Uday. Nothing here is invented.
//
// If you update index.html (new project, new milestone, new links), update
// this file to match — otherwise the chatbot will simply say it doesn't
// have that information, which is the safe failure mode by design.
// ============================================================================

const PORTFOLIO_KNOWLEDGE = `
ABOUT UDAY
- Full name: Uday Shinde.
- Third-year Computer Science & Engineering student at G H Raisoni International
  Skill Tech University (GHRISTU), Pune. Expected graduation: 2028.
- CGPA: 8.45 (site also references 8.25 in one older section — if asked, say his
  CGPA is in the 8.25–8.45 range as shown on different parts of the site, do not
  guess a single more-precise number).
- Based in Pune, India. Open to remote work or relocation.
- Selected for the Cummins India Foundation "Nurturing Brilliance" Scholarship
  (2025–28), which covers full tuition and includes mentorship from senior
  industry leaders.
- Co-authored a conference paper on AI-powered vulnerability scanning /
  cybersecurity, titled "Recent Trends in Cybersecurity", presented at the
  NCET-STEM-25 conference in March 2025.
- Student Coordinator of the college's Developers Club (2025–present), leading
  workshops, hackathon prep sessions, and technical events; mentored 30+
  juniors on web development and open-source contribution.
- Stated career goal: a ₹25 LPA+ tech role by 2028, being pursued through
  structured skill-building (DSA, system design, cloud) and real projects.
- Values/interests he lists: Builder Mindset, Cybersecurity, AI/ML curiosity,
  GATE 2028 prep, Open Source.
- Status: "Open to Work" per the site.

SKILLS (as listed in the Tech Arsenal section)
HTML5/CSS3, JavaScript, Python, Java/Spring Boot, C/C++, Node.js/Express,
React.js, MongoDB, Cybersecurity, AI Tools & LLMs, Git & GitHub, Docker
(basics), Vercel/Netlify, Figma/Canva, Firebase, MySQL/PostgreSQL.
Soft skills he lists: Problem Solving, Leadership, Communication, Time
Management.

PROJECTS
1. InternTrack — Personal CRM for job seekers to track applications,
   interviews, deadlines, and offers. Full MERN stack (MongoDB, Express,
   React, Node.js) with JWT auth, a Kanban board, and an analytics dashboard.
2. CampusMart — Student second-hand marketplace app for buying, selling, and
   exchanging items within a college campus. Real-time listings, secure auth,
   image uploads. Built with MERN, Cloudinary, and Socket.io, styled with
   Tailwind.
3. Jarvis AI Voice Assistant — Python-based AI voice assistant using Google
   Generative AI (Gemini), speech recognition, and text-to-speech. Handles
   queries, opens apps, plays media, integrates with daily workflows.
4. Smart Attendance System — Face-recognition-based attendance system using
   OpenCV and Python (with Tkinter UI). Auto-marks attendance, generates CSV
   reports, real-time dashboard. Built as an academic micro-project.
5. NexaBank ATM — Spring Boot REST API banking simulation (Java) with a
   glassmorphism frontend. Account management, transaction history, PIN
   verification, real-time balance updates. Uses MySQL.
6. SpendWise — MERN stack personal expense tracker with JWT auth, budget
   analytics, category breakdown charts (Chart.js), and export functionality.
   Built for a Web Technology course.
7. Alzheimer Smartwatch (concept) — IoT + AI concept for a smartwatch aimed at
   Alzheimer's patients: real-time location tracking, medication reminders,
   face recognition for caregiver alerts, anomaly detection via ML.
8. Crypto Address Categorization System — A cybersecurity/blockchain project
   addressing the use of pseudo-anonymous cryptocurrency addresses in illicit
   activity (money laundering, drug trafficking, terror financing), focused on
   categorizing/analyzing crypto addresses. (Do not state specific accuracy
   numbers, datasets, or publication details beyond this description — they
   are not confirmed in the source content.)

EXPERIENCE / TIMELINE
- Student Coordinator, Developers Club, GHRISTU Pune (2025–present).
- Cummins Nurturing Brilliance Scholar, Cummins India Foundation (2025–2028) —
  full tuition scholarship, laptop grant, soft-skills training, and an
  assigned industry mentor.
- Research Paper Co-Author, NCET-STEM-25 Conference (March 2025) — "Recent
  Trends in Cybersecurity", on AI-powered vulnerability scanning and threat
  detection.
- Smart India Hackathon 2025 (SIH) — led a team building a Blockchain + IoT
  security framework (cybersecurity problem statement); advanced to
  college-level screening with a working prototype.
- B.Tech CSE, G H Raisoni International Skill Tech University, 2024–present,
  focused on Full-Stack Development, Cybersecurity, and AI/ML.

CONTACT & LINKS
- Email: shinde.uday538@gmail.com
- LinkedIn: linkedin.com/in/udayxshinde
- GitHub: github.com/udayx-dev
- WhatsApp is also listed on the site as a quick-chat option.
- Resume is downloadable from the site's Resume/About sections.
- Uday says he's open to internships, freelance projects, hackathon
  collaborations, and mentorship conversations.

WHAT THE ASSISTANT SHOULD NOT DO
- Never invent companies he has worked for, job titles, certifications,
  specific dates, awards, or metrics that are not listed above.
- If asked something not covered here (e.g. exact salary expectations,
  personal life details, availability calendar, unlisted technologies), say
  plainly that you don't have that information and suggest contacting Uday
  directly at the email/LinkedIn above, or offer to pass along a message.
`.trim();

module.exports = { PORTFOLIO_KNOWLEDGE };
