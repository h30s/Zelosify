# Vendor and Hiring Manager Contract Management Module

## About the Project

This project helps IT vendors share candidate resumes and helps hiring managers find the right people for their job openings.

It has two types of users. Vendors can view openings and upload resumes. Hiring managers can review candidates, check their AI scores, and shortlist or reject them.

## Main Features

**For Vendors**
- View available job openings
- Upload resumes in PDF and PPTX format
- Manage candidate profiles

**For Hiring Managers**
- View assigned job openings
- Check candidate details and AI scores
- Preview resumes
- Shortlist or reject candidates

**AI Recommendation System**

The AI agent reads resumes, checks skills and experience, and matches candidates with job requirements. It uses different tools to complete these tasks. The final score is calculated using fixed rules, so the results are easier to check and understand.

The score is based on three things:

- Skills: 50%
- Experience: 30%
- Location: 20%

Candidates are marked as Recommended, Borderline, or Not Recommended based on their final score.

## Security

Each user can only access the data they are allowed to see. Vendors cannot access other vendors' candidates, and hiring managers can only manage their assigned openings.

The system also checks user roles, validates AI responses, handles errors, and keeps logs to help find problems.

## Technologies Used

- Frontend: Next.js
- Backend: Node.js and Express.js
- Database: PostgreSQL and Prisma
- AI: Groq and Gemini
- File Storage: AWS S3
- Testing: Vitest

## How to Run the Project

### Start the Backend

```bash
cd Zelosify-Backend/Server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Add the required database details and API keys to the `.env` file before starting the server.

### Start the Frontend

```bash
cd Zelosify-Frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173/login` in your browser.

### Run Tests

```bash
cd Zelosify-Backend/Server
npx vitest run
```

The tests check candidate matching, scoring, security, the hiring process, and performance with 100 candidate profiles.

## Demo Login

Set `ENABLE_DEV_LOGIN=true` to enable the demo login options.

| User | Username |
|---|---|
| IT Vendor | `vendor_gotham` |
| Hiring Manager | `bruce_hm1` |
| Second Hiring Manager | `bruce_hm2` |
| LexCorp Vendor | `vendor_lex` |

## Project Structure

The project has two main parts.

The `Zelosify-Frontend` folder contains the user interface, including vendor pages, hiring manager pages, and reusable components.

The `Zelosify-Backend/Server` folder contains the APIs, database setup, authentication, file storage, AI tools, and tests.

## What This Project Covers

The project brings resume uploads, candidate matching, AI recommendations, and candidate selection into one place. It also focuses on keeping user data secure and making the matching process easy to understand and test.