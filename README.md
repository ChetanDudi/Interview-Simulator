# Interview Simulator

AI-powered interview preparation platform built with ASP.NET Core, PostgreSQL, SignalR, and OpenAI-based services.

This project is being built as a secure, production-minded mock interview system where a student uploads a resume, receives AI-generated interview questions, answers by voice, gets evaluated, and receives a final professional report.

## Project Goal

The system will support this flow:

1. User registers and logs in securely.
2. User uploads a resume PDF.
3. Backend extracts text from the resume.
4. AI identifies skills, projects, education, and experience.
5. AI generates interview questions based on those skills.
6. User answers in a live interview session.
7. Speech is converted to text.
8. AI evaluates technical quality and communication.
9. A final feedback report is generated and stored.

## Core Design Principles

- Security first: validation, authorization, secret management, safe file handling, and hardened deployment.
- Clean Architecture: domain logic stays independent from infrastructure and UI.
- Deployability: container-friendly structure and environment-based configuration.
- Extensibility: each module can grow independently without breaking the whole system.
- Replaceability: database, cache, storage, and provider choices should be swappable with minimal application-layer changes.

## Planned Technology Stack

### Backend

- C#
- ASP.NET Core Web API
- ASP.NET Identity
- JWT Authentication
- SignalR

### Database

- PostgreSQL
- Entity Framework Core

Planned for future flexibility:

- database provider isolation inside `Persistence`
- database-specific logic kept out of `Application` and `Domain`

### Performance and Delivery

- Redis later for distributed caching
- CDN later for frontend and static assets
- object storage abstraction for resumes and audio files

### AI and Processing

- OpenAI API for structured extraction, question generation, and answer evaluation
- Whisper or Azure Speech for speech-to-text

### Architecture and Delivery

- Clean Architecture
- Docker
- GitHub Actions later

## Structure Decision

I reviewed the alternate structure carefully.

What we are keeping:

- `Domain`
- `Application`
- `Infrastructure`
- `API`
- `WebUI`

What we are **not** changing:

- We are **keeping `Persistence` as a separate project**.

Why:

- This project is already heading toward real complexity: Identity, EF Core, PostgreSQL, migrations, file storage, AI integrations, SignalR, and reporting.
- Keeping `Persistence` separate makes database code easier to isolate from external services like OpenAI, Whisper, storage, and messaging.
- It also keeps migrations, DbContext, entity mappings, and data-specific concerns from getting mixed into a large catch-all `Infrastructure` project.

So the final decision is:

- Keep the current multi-project Clean Architecture boundary.
- Adopt the useful folder ideas from your suggestion inside `docs`, `tests`, and module organization.

## Current Project Structure

```text
InterviewSimulator/
+-- docs/
|   +-- API/
|   +-- Architecture/
|   +-- ERD/
|   +-- Screenshots/
|   +-- Security/
|   +-- SequenceDiagrams/
|   +-- commands-and-setup.md
|   +-- roadmap.md
+-- docker/
+-- src/
|   +-- API/
|   |   +-- Controllers/
|   |   |   +-- AuthController.cs
|   |   |   +-- SystemController.cs
|   |   +-- Properties/
|   |   +-- appsettings.json
|   |   +-- appsettings.Development.json
|   |   +-- InterviewSimulator.API.csproj
|   |   +-- Program.cs
|   +-- Application/
|   |   +-- Abstractions/Auth/
|   |   +-- Auth/Models/
|   |   +-- InterviewSimulator.Application.csproj
|   +-- Domain/
|   |   +-- Entities/
|   |   +-- InterviewSimulator.Domain.csproj
|   +-- Infrastructure/
|   |   +-- Security/
|   |   +-- InterviewSimulator.Infrastructure.csproj
|   +-- Persistence/
|   |   +-- Db/
|   |   +-- Identity/
|   |   +-- Migrations/
|   |   +-- Services/
|   |   +-- InterviewSimulator.Persistence.csproj
|   +-- WebUI/
|       +-- public/
|       +-- src/
|       |   +-- api/
|       |   |   +-- auth.ts       <- fetch calls for register / login
|       |   |   +-- types.ts      <- shared request / response types
|       |   +-- components/
|       |   |   +-- NavBar.tsx
|       |   |   +-- ProtectedRoute.tsx
|       |   +-- context/
|       |   |   +-- AuthContext.tsx
|       |   +-- pages/
|       |   |   +-- HomePage.tsx
|       |   |   +-- LoginPage.tsx
|       |   |   +-- RegisterPage.tsx
|       |   +-- App.tsx
|       |   +-- index.css
|       |   +-- main.tsx
|       +-- index.html
|       +-- package.json
|       +-- tsconfig.json
|       +-- vite.config.ts
+-- tests/
|   +-- ApiTests/
|   +-- IntegrationTests/
|   +-- UnitTests/
+-- InterviewSimulator.slnx
+-- README.md
```

## What Each File and Folder Contains

### Root

`InterviewSimulator.slnx`

- The .NET solution file.
- It connects all project layers under one solution.
- New projects will be added here as the system grows.

`README.md`

- Main project handbook.
- Explains architecture, folders, theory, and development flow.
- Practical terminal commands live in `docs/commands-and-setup.md`.

### Documentation

`docs/`

- Holds architecture and operational documentation.
- We are expanding this beyond a single roadmap so the project looks professional and stays maintainable.

`docs/roadmap.md`

- Phase-by-phase implementation roadmap.
- Describes the order in which modules will be built.
- Helps keep the project focused and structured.

`docs/commands-and-setup.md`

- Command reference for install, build, run, migrations, secrets, and daily development flow.

`docs/Architecture/`

- High-level architecture notes, diagrams, module boundaries, and dependency flow documents.
- Also contains database portability, caching, CDN, and deployment flow documentation.

`docs/API/`

- API contracts, sample requests, endpoint conventions, and auth examples.

`docs/ERD/`

- Database entity relationship documentation.

`docs/SequenceDiagrams/`

- Request flow diagrams such as login, resume upload, interview session, and answer evaluation.

`docs/Security/`

- Security decisions, threat notes, auth rules, and deployment hardening guidance.

`docs/Screenshots/`

- Product screenshots and UI proof as the project grows.

`docker/`

- Container files will live here.
- This will later include Dockerfiles, compose files, and environment examples.

`tests/`

- Dedicated test area.
- We will split tests into unit, integration, and API-focused suites.

### Source Folder

`src/`

- Contains all application source code.
- Each subfolder maps to one architecture layer.

### API Layer

`src/API/`

- Entry point of the backend application.
- Exposes HTTP endpoints.
- Wires dependency injection, middleware, authentication, authorization, CORS, logging, and runtime configuration.

`src/API/Program.cs`

- Application bootstrap file.
- Starts the ASP.NET Core server.
- Registers controllers and, later, security, database, SignalR, rate limiting, exception handling, and other middleware.

`src/API/Controllers/`

- Holds API controller classes.
- Each controller exposes related routes such as auth, resumes, interviews, reports, or admin actions.

`src/API/appsettings.json`

- Base configuration file.
- Will contain safe non-secret defaults such as logging, allowed hosts, feature flags, and section names.

`src/API/appsettings.Development.json`

- Development-only overrides.
- Used for local environment differences such as debug logging or local service URLs.
- Secrets should not live here permanently. Use `.NET user-secrets` for local passwords and JWT keys.

`src/API/InterviewSimulator.API.csproj`

- Project definition for the backend API.
- Declares target framework and package references.

`src/API/InterviewSimulator.API.http`

- Local HTTP request file generated by the template.
- Can be used to manually test endpoints from supported editors.

`src/API/WeatherForecast.cs`

- Template sample model from the default ASP.NET project.
- Temporary placeholder and will likely be removed once real modules are added.

### Domain Layer

`src/Domain/`

- Contains core business entities and rules.
- This layer should not depend on UI, database, or external APIs.

`src/Domain/Class1.cs`

- Temporary placeholder from the template.
- Will be replaced by entities like `User`, `Role`, `Resume`, `InterviewSession`, `Question`, `Answer`, and `FeedbackReport`.

`src/Domain/InterviewSimulator.Domain.csproj`

- Project definition for domain entities and business abstractions.

### Application Layer

`src/Application/`

- Contains use cases and application logic.
- Coordinates domain objects and defines contracts for infrastructure services.

`src/Application/InterviewSimulator.Application.csproj`

- Project definition for use-case logic.

### Infrastructure Layer

`src/Infrastructure/`

- Contains implementations for external integrations.
- This will include AI providers, speech services, email sending, file storage helpers, and security-related service implementations.

`src/Infrastructure/InterviewSimulator.Infrastructure.csproj`

- Project definition for integration services and external dependencies.

### Persistence Layer

`src/Persistence/`

- Contains database-related code.
- Will manage Entity Framework Core, database context, mappings, migrations, repositories if used, and data access configuration.

`src/Persistence/InterviewSimulator.Persistence.csproj`

- Project definition for database access.

### WebUI Layer

`src/WebUI/`

- React + TypeScript frontend application built with Vite.
- Communicates with the backend API via `/api` proxy in development.

`src/WebUI/src/main.tsx`

- React entry point. Wraps the app in `AuthProvider` and renders the router.

`src/WebUI/src/App.tsx`

- React Router setup. Defines all routes including the protected `/home` route.

`src/WebUI/src/api/`

- `types.ts` — Shared TypeScript interfaces for requests and responses.
- `auth.ts` — Typed fetch wrappers for `/api/auth/register` and `/api/auth/login`.

`src/WebUI/src/context/AuthContext.tsx`

- Global auth state using React Context.
- Stores the JWT token and user profile in `localStorage`.
- Exposes `signIn()` and `signOut()` helpers used across pages.

`src/WebUI/src/components/`

- `NavBar.tsx` — Top navigation bar with user greeting and sign-out button.
- `ProtectedRoute.tsx` — Redirects unauthenticated users to `/login`.

`src/WebUI/src/pages/`

- `LoginPage.tsx` — Email and password form. Calls `/api/auth/login`.
- `RegisterPage.tsx` — Name, email, password form. Calls `/api/auth/register`.
- `HomePage.tsx` — Dashboard shown after login. Displays user info and coming-soon features.

`src/WebUI/src/index.css`

- Global styles — dark theme, CSS variables, buttons, form controls, layout.

## Planned Folder Structure As We Build

This is the intended direction for the source tree:

```text
src/
+-- API/
|   +-- Controllers/
|   +-- Middleware/
|   +-- Extensions/
|   +-- Hubs/
|   +-- Contracts/
|   +-- Filters/
|   +-- Program.cs
+-- Application/
|   +-- Features/
|   +-- Abstractions/
|   |   +-- AI/
|   |   +-- Caching/
|   |   +-- Storage/
|   +-- DTOs/
|   +-- Behaviors/
|   +-- Exceptions/
|   +-- Mappings/
|   +-- Common/
|   +-- DependencyInjection.cs
+-- Domain/
|   +-- Entities/
|   +-- Enums/
|   +-- ValueObjects/
|   +-- Events/
|   +-- Common/
+-- Infrastructure/
|   +-- AI/
|   +-- Speech/
|   +-- Storage/
|   +-- Caching/
|   +-- Security/
|   +-- BackgroundJobs/
|   +-- DependencyInjection.cs
+-- Persistence/
|   +-- Db/
|   +-- Configurations/
|   +-- Migrations/
|   +-- Repositories/
|   +-- Seed/
|   +-- DependencyInjection.cs
+-- WebUI/
    +-- src/
    +-- public/
    +-- package.json or equivalent
```

Inside `Application/Features/`, we will organize by module:

- `Auth`
- `Resume`
- `Interview`
- `Questions`
- `Answers`
- `Feedback`

## Module Theory: What Will Live Where

### Database Portability Rule

We are designing this project so a future database change is manageable.

That means:

- `Domain` contains no provider-specific logic
- `Application` depends on use cases and abstractions, not PostgreSQL details
- `Persistence` owns EF Core, migrations, and provider configuration
- if we later move databases, most changes should stay inside `Persistence`

### Caching and CDN Rule

We will treat these as system-level concerns, not random add-ons.

- CDN is mainly for frontend static delivery and public assets
- cache is mainly for repeated reads, temporary state helpers, and scale-out performance
- authenticated and highly sensitive content must remain tightly controlled by the API

### Authentication Module

Will contain:

- User identity management
- Role management
- JWT generation and validation
- Password hashing
- Login and registration flows

Primary locations:

- `src/Domain/Entities/`
- `src/Application/Auth/`
- `src/Persistence/Db/`
- `src/API/Controllers/`

### Resume Analyzer Module

Will contain:

- Resume upload endpoint
- File validation
- PDF text extraction
- Resume metadata persistence

Primary locations:

- `src/API/Controllers/`
- `src/Application/Resumes/`
- `src/Infrastructure/Storage/`
- `src/Infrastructure/AI/`
- `src/Persistence/Db/`

### Skill Extraction Module

Will contain:

- Structured extraction from resume text
- Skill normalization
- Tagging by confidence or category

Primary locations:

- `src/Application/Resumes/`
- `src/Infrastructure/AI/`

### Interview Engine Module

Will contain:

- Interview session creation
- Question generation
- Question sequencing
- Session state tracking

Primary locations:

- `src/Application/Interviews/`
- `src/Domain/Entities/`
- `src/Persistence/Db/`
- `src/API/Hubs/`

### Speech-to-Text Module

Will contain:

- Audio upload or streaming
- Speech transcription provider integration
- Transcript persistence

Primary locations:

- `src/Infrastructure/Speech/`
- `src/Application/Interviews/`
- `src/API/Hubs/`

### Answer Evaluation Module

Will contain:

- Technical correctness scoring
- Communication scoring
- Suggestions for improvement

Primary locations:

- `src/Application/Evaluation/`
- `src/Infrastructure/AI/`

### Confidence Analysis Module

Will contain:

- Filler word detection
- speaking pace metrics
- pause analysis
- confidence scoring heuristics

Primary locations:

- `src/Application/Evaluation/`
- `src/Infrastructure/Speech/`

### Reporting Module

Will contain:

- Score aggregation
- Final JSON feedback model
- User-facing report generation

Primary locations:

- `src/Application/Reports/`
- `src/Persistence/Db/`
- `src/API/Controllers/`

## Security Plan

This project is intended to be secure by design, not secure later.

Security priorities:

- ASP.NET Identity for user management
- JWT authentication with short-lived tokens
- Refresh token rotation later
- Role-based authorization
- Object-level authorization so one user cannot access another user's data by changing ids in the URL
- Password hashing with framework defaults
- Input validation on every request
- File upload restrictions by type and size
- Secure secret storage through environment variables
- HttpOnly, Secure, SameSite cookie strategy when we move from simple token responses to production session handling
- Centralized exception handling
- Minimal information leakage in production errors
- Database access through EF Core only
- Prepared, parameterized queries
- CORS restrictions for the frontend origin
- Rate limiting for public endpoints
- Session revocation support
- Audit logging for auth-sensitive actions
- Logging and audit-friendly activity tracking
- backend ownership checks for every user-owned resource
- no trust in pasted URLs, query ids, or client-side route guards alone

Important note:

- No application is impossible to hack.
- Our goal is to make it professionally secure, difficult to abuse, and safe to operate and deploy.

### Your Page Security Requirement

Your requirement is valid, and this is how we will enforce it:

- Every protected page must require authentication.
- Every protected API endpoint must verify authorization on the server, not just in the frontend.
- Copy-pasting a protected URL into another browser must not work unless that browser is already authenticated.
- Changing a URL id such as `/users/123` or `/reports/55` must never expose another user's data.
- We will check resource ownership on the backend for every user-owned resource.

One important clarification:

- If two tabs are in the **same logged-in browser session**, the same auth cookie or token will usually work in both tabs. That is normal and desirable.
- If you want even tab-to-tab isolation inside the same browser, that is possible but unusual and adds friction.
- What matters most is that another browser, another device, or another user cannot gain access just by pasting a URL.

So our secure rule will be:

- Same authenticated session: allowed.
- Different browser or not logged in: forced to log in again.
- Different user id in URL: denied by backend authorization.

## Development Phases

1. Foundation and documentation
2. Authentication and authorization
3. Database integration and portability baseline
4. Resume upload and parsing
5. Skill extraction
6. Interview session and question generation
7. Real-time SignalR interview flow
8. Speech-to-text integration
9. Answer evaluation and confidence analysis
10. Caching, CDN strategy, Docker, and deployment

## Setup And Commands

- [commands-and-setup.md](docs/commands-and-setup.md) — install, build, run, migrations, frontend
- [database-guide.md](docs/database-guide.md) — how to connect and browse the PostgreSQL database

That guide contains:

- what to install
- which terminal to use
- one-time local setup
- build commands
- run commands
- migration commands
- package commands
- troubleshooting notes

## Generated Folders You Can Ignore

`bin/`

- Compiled output.
- Created automatically after builds.

`obj/`

- Intermediate build files.
- Created automatically by the .NET SDK.

These should not be treated as handwritten source code.

## Current Status

### Completed

- Clean Architecture solution scaffold
- Full documentation structure
- Roadmap and architecture docs
- ASP.NET Core API bootstrap
- **Authentication backend** — register, login, JWT generation, ASP.NET Identity, PostgreSQL, EF Core migrations
- **Authentication frontend** — Login page, Register page, Home page, Auth context, protected routing, API client

### Phase 2 Complete — Auth Frontend

- Login, Register, ForgotPassword, ResetPassword pages fully wired to backend
- JWT stored in localStorage, sent as Bearer token on all protected requests
- Eye icon toggle on all password fields
- Forgot password flow: generates reset token (shown in dev — will be emailed in production)
- Protected `/home` route — unauthenticated users redirected to `/login`

### Phase 2.5 Complete — Email OTP Verification

- Registration creates an unconfirmed account and sends a 6-digit OTP to the user's email
- Login with an unconfirmed email auto-sends a new OTP and redirects to verification
- Forgot password sends a 6-digit OTP; after verification the user sets a new password
- Resend OTP enforces a 60-second cooldown with a live countdown timer on the UI
- OTPs expire after 10 minutes; each new OTP invalidates all previous ones for that email
- **Dev mode:** OTPs are printed in the terminal (yellow text) — no SMTP needed
- **Production mode:** set `Email:Provider = "Smtp"` and configure SMTP credentials via user-secrets
- New DB table: `EmailOtps` — migration command below

### Phase 3 Complete — Resume Upload

- `POST /api/resumes` — authenticated PDF upload, 10 MB limit, stored in `uploads/resumes/{userId}/`
- `GET /api/resumes` — lists current user's resumes
- `DELETE /api/resumes/{id}` — deletes resume (ownership checked server-side)
- `LocalFileStorage` in Infrastructure — swappable with S3/Azure later via `IFileStorage`
- Resume page at `/resumes` with drag-and-drop upload, file list, and delete
- EF Core migration `AddResumesTable` adds the `Resumes` table (run command below)

### Phase 4 Complete — AI Question Generation + Voice Interview + Feedback Report

- Upload PDF → PdfPig extracts full resume text automatically on upload
- `POST /api/sessions` — GPT-4o-mini reads resume text, generates 8 personalised questions
- Interview page at `/interview/{id}` — questions shown one at a time with progress bar
- Voice input via browser Web Speech API — click mic, speak, text appears in answer box
- Dot navigation — jump to any question, dots turn green when answered
- Submit all answers → OpenAI evaluates each one → report generated instantly
- `GET /api/sessions/{id}/report` — returns scores + per-question AI feedback
- Report page at `/report/{id}` — animated score rings (Overall / Technical / Communication)
- Per-question breakdown: your answer, AI feedback, improvement tip
- All four home page features now live (no more "Coming Soon")

### Next

- Refresh token / session expiry handling
- Docker setup
- CI/CD pipeline

## Recommended Build Discipline

As we continue, we should follow this rule:

1. Add one module at a time.
2. Keep the application buildable after every step.
3. Verify compile and runtime commands after each module.
4. Update this README whenever the folder structure changes.

## Next Expected Files

Very soon we will add files like:

- `src/Domain/Entities/User.cs`
- `src/Domain/Entities/Role.cs`
- `src/Domain/Entities/UserRole.cs`
- `src/Application/Auth/Commands/RegisterUserCommand.cs`
- `src/Application/Auth/Commands/LoginUserCommand.cs`
- `src/Persistence/Db/AppDbContext.cs`
- `src/API/Controllers/AuthController.cs`
- `src/API/Extensions/ServiceCollectionExtensions.cs`

Those files will form the first real backend module.
