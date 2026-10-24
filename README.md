# Smart Notes

Smart Notes is a Next.js-powered notes application designed for structured writing, AI-assisted workflows, PDF import/export, collaborative note editing, and role-based support / review management. The project combines a modern React + Next.js frontend with PostgreSQL via Prisma and Supabase for authentication and session management.

This repository is a full-stack application intended to help users create, organize, secure, and share notes while enabling productivity workflows such as tagging, pinned notes, note exports, and collaboration invites.

## Table of contents

- [Overview](#overview)
- [Project goals](#project-goals)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Running the app](#running-the-app)
- [Available scripts](#available-scripts)
- [Core application flows](#core-application-flows)
- [Authentication and authorization](#authentication-and-authorization)
- [Notes and AI features](#notes-and-ai-features)
- [Collaboration model](#collaboration-model)
- [Review and support systems](#review-and-support-systems)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Project status and notes](#project-status-and-notes)
- [Documentation and references](#documentation-and-references)

## Overview

Smart Notes is more than a basic note-taking app. It includes:

- Rich note creation and editing
- PDF import and export
- AI-powered Q&A over a user's notes
- Collaborative editing invites with token-based sharing
- Role-based access for admin/supervisor workflows
- Support ticket creation and handling
- User review and reply functionality
- Notebook-style organization with note grouping

The project is structured around server actions and Prisma models, using App Router architecture from Next.js 16.

## Project goals

The application aims to provide:

- A clean, fast writing experience for users
- Secure storage and access control
- Cross-device access through a web application
- Real-world collaboration features for shared notes
- Extensibility by separating business logic into server actions
- A strong foundation for AI-enhanced productivity tools

## Key features

### 1. Notes management

- Create notes with title, content, tags, and pinning
- Edit note content with a rich text interface
- Store notes in PostgreSQL with Prisma
- Validate note titles, tags, and text with Zod schemas
- Export notes as PDFs
- Import notes from PDF files by extracting readable content

### 2. AI-powered note interactions

- Ask the AI questions about a user's saved notes
- Uses the OpenAI SDK to analyze recent notes and respond with note-aware answers
- Supports chat-style multi-question interaction
- Parses note text to remove HTML before sending to the model

### 3. Collaboration

- Notes can be toggled between private and collaborative modes
- Invite collaborators by user ID or via share link
- Invite tokens are generated and linked to note access flows
- Pending invites support accept/reject workflows
- Collaboration uses Prisma relations between Note and User models

### 4. Authentication and access control

- Supabase SSR is used for session handling
- Server-side helpers enforce login requirements
- Access validation ensures users can only work with notes they own or are invited to
- Role checks support admin and supervisor actions

### 5. Review and support modules

- Users can create or update a review with a rating/comment
- Review replies are stored and queried by thread
- Support tickets allow users to submit issues with optional image evidence
- Admin and supervisor roles can manage support tickets and statuses

### 6. Notebook organization

- Notes can be assigned to notebooks
- Notebook hierarchy supports parent/child organization
- Collaborators can share notebooks with editor/viewer roles
- Ordered note assignment is tracked with `position` metadata

### 7. Security-focused design

- Input validation via Zod schemas
- Sanitization of HTML and user-provided data before persistence
- Validation helpers for permissions and schema verification
- Access checks on sensitive actions

## Technology stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Motion library for UI transitions
- TipTap-based rich text editing components

### Backend

- Prisma ORM
- PostgreSQL database
- Server actions in Next.js App Router
- Supabase Auth / SSR integration

### AI and content processing

- OpenAI API
- PDF parsing via `pdf-parse`
- PDF generation via `pdf-lib`

### Security and validation

- Zod
- HTML sanitization
- Supabase SSR session management

## System architecture

The application is built around a few major layers:

1. Client layer
   - App pages and interface components in `src/app` and `src/components`
   - User interactions trigger server actions

2. Server action layer
   - Business logic lives in `src/actions`
   - Handles note changes, collaboration, reviews, support tickets, and AI prompts

3. Data layer
   - Prisma schema defines database models and relationships
   - PostgreSQL stores notes, users, invites, notebooks, reviews, and tickets

4. Auth layer
   - Supabase manages sessions and cookies
   - `src/auth/server.ts` provides a server-side user getter
   - `src/lib/helpers.ts` wraps access validation and authorization

5. AI layer
   - `src/openai/index.ts` creates the OpenAI client
   - `askAIAboutNotesAction` sends recent notes and user questions to the model

## Repository structure

```text
smart-notes/
├── src/
│   ├── actions/
│   │   ├── collaboration.ts
│   │   ├── notes.ts
│   │   ├── reviews.ts
│   │   ├── support.ts
│   │   ├── users.ts
│   │   └── notebooks.ts
│   ├── app/
│   │   ├── auth/
│   │   ├── blocked/
│   │   ├── control/
│   │   ├── forgot-password/
│   │   ├── login/
│   │   ├── logout/
│   │   ├── notes/
│   │   ├── reset-password/
│   │   ├── reviews/
│   │   ├── sign-up/
│   │   ├── support/
│   │   ├── favicon.ico
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── auth/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── footer.tsx
│   │   ├── hero-section.tsx
│   │   ├── features-4.tsx
│   │   └── team.tsx
│   ├── db/
│   │   ├── prisma.ts
│   │   └── schema.prisma
│   ├── lib/
│   │   ├── helpers.ts
│   │   ├── security.ts
│   │   ├── utils.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── middleware.ts
│   ├── openai/
│   │   └── index.ts
│   └── ...
├── public/
│   └── team/member images and branding assets
├── docs/
│   ├── README.md
│   ├── actions/
│   ├── app/
│   ├── auth/
│   ├── components/
│   ├── db/
│   ├── hooks/
│   ├── lib/
│   └── providers/
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── components.json
├── eslint.config.mjs
├── postcss.config.mjs
├── .gitignore
├── .prettierrc
├── DEPLOYMENT.md
├── DEPLOY_STEPS.md
├── SECURITY.md
├── TROUBLESHOOTING.md
├── README.md
└── ...
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 20+
- pnpm
- PostgreSQL database
- Supabase project
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/voidness-x/smart-notes.git
cd smart-notes
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure your environment variables as described below.

4. Generate Prisma client and prepare the database:

```bash
pnpm dlx prisma@6.19.0 generate --schema=src/db/schema.prisma
```

5. Start the development server:

```bash
pnpm dev
```

The application should run on `http://localhost:3000`.

## Environment variables

Create a `.env.local` file in the root of the project and configure values similar to the following:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"

# Supabase auth
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_ANON_KEY="<anon-key>"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="<your-openai-key>"
```

Notes:

- `DATABASE_URL` is required by Prisma.
- `DIRECT_URL` is also referenced by the schema and supports direct database access patterns.
- `NEXT_PUBLIC_BASE_URL` is used for invite links and production-friendly redirect URLs.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are required for auth/session handling.
- `OPENAI_API_KEY` enables AI-powered note analysis.

## Database setup

This project uses PostgreSQL with Prisma.

### Prisma schema overview

The main database models include:

- `User`
- `Note`
- `CollaborationInvite`
- `Notebook`
- `NoteNotebook`
- `NotebookCollaborator`
- `Review`
- `ReviewReply`
- `SupportTicket`

### Example workflow

```bash
pnpm dlx prisma@6.19.0 generate --schema=src/db/schema.prisma
pnpm dlx prisma@6.19.0 db push --schema=src/db/schema.prisma
```

The project also includes migration-helper documentation files such as:

- `RUN_MIGRATIONS.md`
- `POST_MIGRATION_CHECKLIST.md`
- `COMPLETE_MIGRATION.sql`

## Running the app

### Development mode

```bash
pnpm dev
```

### Production build

```bash
pnpm build
pnpm start
```

## Available scripts

From `package.json`:

- `pnpm dev` – run the Next.js app in development mode
- `pnpm build` – generate Prisma client and build the production application
- `pnpm start` – start the production server
- `pnpm lint` – run ESLint checks
- `pnpm migrate` – run Prisma generation and migration-related setup steps

## Core application flows

### Authentication flow

- User visits login or sign-up page
- Middleware checks the route and Supabase session state
- `getUser()` reads current session information from cookies
- Protected actions call `requireAuth()`
- Access is validated before database operations

### Note creation and editing flow

- A user creates a note via the notes page
- The note is stored with author metadata and initial empty or default content
- The text editor updates note content via server actions
- Titles and tags are validated and saved
- AI and export flows use the stored note content

### Collaboration invite flow

- A note author toggles collaboration on
- The app creates an invite token or sends an invite to a specific user
- Receiver accepts via invite token or invite list
- The note becomes collaborative and user is added as collaborator
- Access checks allow the invited user to read and edit note content

### AI note review flow

- User selects notes from their account
- The app reduces note markdown/HTML to plain text
- It sends recent notes and a question list to OpenAI
- The model returns conversational responses grounded in the user’s note data

## Authentication and authorization

The app uses a combination of:

- Supabase session cookies
- `src/auth/server.ts` server-side user retrieval
- `src/lib/helpers.ts` wrappers for authentication and validation
- `src/lib/security.ts` for access-control checks

### Authorization helpers

Key helpers in the codebase include:

- `requireAuth()` – ensures the current user is logged in
- `requireRole()` – checks role-based access for admin/supervisor actions
- `validateNoteAccess()` – verifies note ownership or collaboration rights
- `validate()` – validates inputs against Zod schemas

This is important because many actions directly modify note content or support records and must prevent unauthorized access.

## Notes and AI features

### Note capabilities

- Create and delete notes
- Pin or unpin notes
- Add and update tags
- Update titles
- Import PDF content
- Export note content to PDF
- Check if a note has changed using polling-based update detection

### AI integration

`askAIAboutNotesAction` performs the following:

- Requires auth
- Limits question count
- Validates each user input
- Loads recent notes for the authenticated user
- Strips HTML tags and converts content to plain text
- Builds a prompt for OpenAI
- Returns the model response

This allows users to ask natural language questions like:

- “What are my recent ideas about marketing?”
- “Summarize my notes from this week”
- “What tasks do I keep repeating?”

## Collaboration model

The collaboration logic is implemented in `src/actions/collaboration.ts` and supported by Prisma relations in `src/db/schema.prisma`.

### Data model highlights

- `Note` has `authorId` and `collaborators`
- `CollaborationInvite` stores invite metadata, token, status, and expiry
- `User` is linked to sent and received invites
- `NotebookCollaborator` supports collaborative notebook access

### Invite use cases

- Invite by user ID to a specific user
- Invite via share URL with token
- Accept or reject by the invite recipient
- Expired or invalid invites are rejected

## Review and support systems

### Reviews

Implemented in `src/actions/reviews.ts`.

Features:

- Create/update review with rating and optional comment
- List all reviews by creation date
- Fetch a user’s own review
- Reply to reviews
- Admin/supervisor deletion of reviews

### Support tickets

Implemented in `src/actions/support.ts`.

Features:

- Create support requests with email, title, description, and optional proof image
- View tickets for the current user
- Fetch all tickets for admin/supervisor roles
- Assign handlers
- Update status and solution text
- Mark ticket satisfaction after completion

## Deployment notes

The project includes several deployment guides and operational docs, including:

- `DEPLOYMENT.md`
- `DEPLOY_STEPS.md`
- `QUICK_DEPLOY.md`
- `START_DEPLOYMENT.md`
- `VERIFY_NOW.md`
- `FIX_NOW.md`

The app is intended for deployment on modern hosting platforms such as:

- Vercel
- Netlify
- Render
- Railway

For production, be sure to set all required environment variables and verify the app can connect to PostgreSQL and Supabase.

## Troubleshooting

Common issues include:

- Missing or invalid database credentials
- Supabase auth configuration issues
- OpenAI key missing or invalid
- Invite links pointing to the wrong base URL
- localhost email issues in local dev environments

Relevant troubleshooting files include:

- `TROUBLESHOOTING.md`
- `SUPABASE_EMAIL_TROUBLESHOOTING.md`
- `FIX_EMAIL_LOCALHOST_ISSUE.md`
- `ENV_CHECK.md`
- `FIX_RUNTIME_ERRORS.md`
- `COLLABORATION_TROUBLESHOOTING.md`

## Project status and notes

This repository is a working full-stack application with a strong emphasis on:

- productivity writing
- AI-assisted workflows
- collaboration
- secure note access
- role-based operations

It includes both production-oriented operational files and project documentation for setup and troubleshooting.

## Documentation and references

Additional project documentation is available in the `docs/` directory with focused explanations of the application’s modules.

Key documentation pages:

- `docs/README.md`
- `docs/actions/collaboration.md`
- `docs/actions/notes.md`
- `docs/actions/reviews.md`
- `docs/actions/support.md`
- `docs/actions/users.md`
- `docs/db/schema.md`
- `docs/auth/server.md`
- `docs/auth/client.md`
- `docs/lib/helpers.md`
- `docs/lib/security.md`

## License and contribution

This project does not currently declare a project license file in the root repository snapshot. If you intend to distribute or contribute to the codebase publicly, you may want to add an explicit license before publishing the project more broadly.

Contributions are welcome, and the project is organized in a way that makes it relatively straightforward to extend with additional features such as:

- advanced search
- real-time multi-user editing
- notebook sharing dashboards
- AI summarization pipelines
- better archival and export workflows

---

Smart Notes is built as a practical, feature-rich notes platform that blends collaboration, AI, structured data, and secure web application patterns into a single application.
