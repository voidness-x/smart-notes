# Security note

This repository is a study project and is not intended for production use or public hosting.

## What this means

- Keep all API keys, database credentials, and auth secrets in local-only environment files.
- Do not publish real credentials or personal data.
- Treat any production-style configuration as an example, not as a deployment blueprint.

## General best practices used in the project

- Validate user input before processing it.
- Use server-side auth checks for protected actions.
- Keep sensitive configuration out of source control.
- Logging should be limited to non-sensitive operational messages.

## This repo is for learning

The code demonstrates patterns for:

- Next.js app architecture
- Prisma database access
- server actions
- authentication flows
- AI-powered note analysis
- collaboration and support features

It is not a production-hardened system and should not be treated as one.
