# Interview Simulator — Complete Technical Reference

Everything used in this project: every technology, pattern, concept, library, and architectural decision — explained plainly.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Backend — ASP.NET Core](#3-backend--aspnet-core)
4. [Database — PostgreSQL + EF Core](#4-database--postgresql--ef-core)
5. [AI / LLM Integration](#5-ai--llm-integration)
6. [Authentication & Security](#6-authentication--security)
7. [File Handling](#7-file-handling)
8. [Frontend — React + TypeScript](#8-frontend--react--typescript)
9. [Frontend Libraries](#9-frontend-libraries)
10. [API Communication](#10-api-communication)
11. [Deployment — Render](#11-deployment--render)
12. [Key Patterns & Concepts](#12-key-patterns--concepts)
13. [All NuGet Packages](#13-all-nuget-packages)
14. [All npm Packages](#14-all-npm-packages)
15. [Interview Q&A Cheatsheet](#15-interview-qa-cheatsheet)

---

## 1. Project Overview

**What it does:** An AI-powered interview preparation platform. Users upload their PDF resume, the AI generates tailored interview questions, users answer them (text or voice), and the AI evaluates every answer with scores and feedback.

**Tech stack at a glance:**

| Layer | Technology |
|---|---|
| API | ASP.NET Core 10 Web API |
| Frontend | React 19 + TypeScript + Vite |
| Database | PostgreSQL (Neon serverless) via EF Core |
| AI | Groq API (LLaMA 3.3 70B) |
| Auth | ASP.NET Identity + JWT |
| Hosting | Render (API as Web Service, UI as Static Site) |

---

## 2. Architecture

### Clean Architecture

The backend is split into four projects. Each layer only knows about layers below it — never above.

```
InterviewSimulator.Domain          ← no dependencies
InterviewSimulator.Application     ← depends on Domain
InterviewSimulator.Infrastructure  ← depends on Application
InterviewSimulator.Persistence     ← depends on Application
InterviewSimulator.API             ← depends on all
```

**Why this matters:** You can swap the database (Persistence), the AI provider (Infrastructure), or the email sender without touching business logic (Application).

### Domain Layer
- Plain C# classes with no framework dependencies.
- Defines the core entities conceptually (though in this project entities live in Persistence for simplicity).

### Application Layer
- Contains **interfaces (abstractions)** — `ISessionService`, `IQuestionGenerator`, `IAnswerEvaluator`, `IResumeAnalyser`, `IAnalyticsService`, `IBehavioralService`, `IBehavioralQuestionGenerator`.
- Contains **models/DTOs** — `SessionResponse`, `ReportResponse`, `AnalyticsResponse`, `BehavioralSessionResponse`, etc.
- Contains **no implementation** — just contracts.

### Infrastructure Layer
- Implements AI abstractions: `QuestionGenerator`, `AnswerEvaluator`, `ResumeAnalyser`, `BehavioralQuestionGenerator`.
- Implements utilities: `PdfPigExtractor` (PDF text), `LocalFileStorage`, `JwtTokenGenerator`, email senders.
- Talks to external services: Groq API, SendGrid, Resend, SMTP.

### Persistence Layer
- Implements database abstractions: `SessionService`, `ResumeService`, `AnalyticsService`, `BehavioralService`, `AuthService`, `PracticeSessionService`.
- Contains EF Core `DbContext`, entity classes, and migrations.

### API Layer
- ASP.NET Core controllers — thin, just parse HTTP requests and call services.
- Middleware, DI registration, JWT config, CORS.

---

## 3. Backend — ASP.NET Core

### ASP.NET Core 10 Web API
- Framework for building HTTP APIs in C#.
- Uses **minimal hosting model** (`WebApplication.CreateBuilder`).
- Controllers inherit from `ControllerBase` (no View support needed).
- Attributes like `[HttpGet]`, `[HttpPost]`, `[Route]`, `[Authorize]` define endpoints.

### Dependency Injection (DI)
- Built into ASP.NET Core — no third-party container needed.
- Services registered in `AddInfrastructure()` and `AddPersistence()` extension methods.
- **Scoped** lifetime used for all services (one instance per HTTP request).
- Constructor injection throughout — no service locator pattern.

### Controllers
Each controller handles one resource:

| Controller | Resource |
|---|---|
| `AuthController` | Register, login, OTP verify, password reset |
| `ResumesController` | Upload, list, delete resumes |
| `SessionsController` | Create interview session, submit answers, get report, share |
| `PracticeController` | Create/view practice sets |
| `AnalyticsController` | GET /api/analytics |
| `BehavioralController` | STAR interview CRUD |

### Middleware pipeline (order matters)
1. HTTPS redirection
2. CORS
3. Authentication (reads JWT from header)
4. Authorization (checks `[Authorize]` attributes)
5. Routing → Controllers

### CORS
- Cross-Origin Resource Sharing — browsers block API calls from a different domain by default.
- Configured to allow the Render frontend URL to call the Render API URL.
- In development: allows any origin.

### `IActionResult` return types
- `Ok(data)` → 200
- `BadRequest(errors)` → 400
- `Unauthorized()` → 401
- `NotFound()` → 404
- `Created(uri, data)` → 201

### `CancellationToken`
- Every async method accepts a `CancellationToken`.
- If the user closes the browser mid-request, ASP.NET cancels the token, and the DB query/AI call is aborted cleanly.

### `IFormFile`
- ASP.NET type for multipart file uploads.
- Used in `ResumesController` to receive the PDF from the browser.

### Raw string literals (`$$"""..."""`)
- C# 11+ feature used for AI prompts.
- `$$` means you need `{{expr}}` for interpolation (single `{` is literal).
- Avoids escaping JSON braces inside prompt text.

---

## 4. Database — PostgreSQL + EF Core

### PostgreSQL
- Open-source relational database.
- Hosted on **Neon** — a serverless PostgreSQL provider with a generous free tier and connection pooling.
- SQL dialect differences from MySQL: `uuid` type, `timestamp with time zone`, `ILIKE`, `character varying`.

### Entity Framework Core (EF Core)
- Microsoft's ORM (Object-Relational Mapper) for .NET.
- Maps C# classes to database tables. You write C# — EF generates SQL.
- Provider: `Npgsql.EntityFrameworkCore.PostgreSQL`.

### DbContext
`InterviewSimulatorDbContext` inherits from `IdentityDbContext` (which itself inherits `DbContext`).

```csharp
public DbSet<AppResume>            Resumes            { get; set; }
public DbSet<AppInterviewSession>  Sessions           { get; set; }
public DbSet<AppBehavioralSession> BehavioralSessions { get; set; }
// ...etc
```

Each `DbSet<T>` is a queryable table.

### Entity Configuration (Fluent API)
In `OnModelCreating`, rules like:
```csharp
e.Property(s => s.Status).HasMaxLength(50).IsRequired();
e.HasOne<AppUser>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
```
- `HasMaxLength` → `character varying(50)` in Postgres.
- `OnDelete(DeleteBehavior.Cascade)` → deleting a user deletes all their data.

### LINQ queries
```csharp
await dbContext.Sessions
    .Include(s => s.Questions)
    .Include(s => s.FeedbackReport)
    .Where(s => s.UserId == userId)
    .OrderByDescending(s => s.CreatedAtUtc)
    .ToListAsync(cancellationToken);
```
EF Core translates this to a single SQL `SELECT` with `JOIN`, `WHERE`, `ORDER BY`.

### Migrations
Schema versioning — each migration is a snapshot of what changed.

**Structure of a migration:**
- `20260607000001_AddTargetRoleToSession.cs` — `Up()` and `Down()` methods (apply / revert).
- `20260607000001_AddTargetRoleToSession.Designer.cs` — full model snapshot at that point in time.
- `InterviewSimulatorDbContextModelSnapshot.cs` — current model snapshot (always the latest).

**Why manual:** `dotnet ef migrations add` requires a working DB connection at design time. Since there was no local PostgreSQL, migrations were hand-authored.

**`dotnet ef database update`** — runs all pending migrations against the real database.

### Cascade Delete
When a `User` is deleted → all their `Resumes`, `Sessions`, `BehavioralSessions` are automatically deleted by the database. No manual cleanup code needed.

### JSON columns
`AppBehavioralSession.QuestionsJson` stores a JSON array as a `text` column.  
Used instead of separate FK tables to avoid schema complexity for behavioral sessions.

```csharp
public string  QuestionsJson { get; set; } = "[]";
public string? FeedbackJson  { get; set; }
```

Serialized/deserialized manually with `System.Text.Json`.

### ASP.NET Core Identity
Built-in membership system. Provides:
- `AppUser` (extends `IdentityUser<Guid>`) — stores email, password hash, etc.
- `UserManager<AppUser>` — create users, validate passwords, manage roles.
- `SignInManager` — not used directly; JWT replaces cookie auth.
- Password hashing (bcrypt-style PBKDF2) — passwords are **never stored in plain text**.
- Email uniqueness enforced at DB level.

---

## 5. AI / LLM Integration

### Groq API
- Groq runs LLaMA 3.3 70B (Meta's open-source model) on custom AI chips (LPUs) that are extremely fast.
- API is OpenAI-compatible — same JSON request/response format.
- Free tier available.

### `ILLMService` / `GroqService`
Single abstraction for all AI calls:
```csharp
public interface ILLMService {
    Task<string> CompleteAsync(string prompt, CancellationToken ct = default);
}
```
`GroqService` sends an HTTP POST to `https://api.groq.com/openai/v1/chat/completions` with the prompt as a user message, and returns the AI's text reply.

**Swappable:** To use OpenAI GPT-4o instead, register `OpenAIService` in DI — zero other changes.

### Prompt Engineering
The quality of AI output depends entirely on how you word the prompt.

Key techniques used:
- **Role priming:** "You are an expert technical interviewer..."
- **Format constraint:** "Return ONLY a valid JSON array — no markdown, no explanation."
- **Schema specification:** Show the exact JSON shape expected.
- **Negative instructions:** "Do NOT use backslashes inside question text."
- **Count constraint:** "Generate exactly {count} questions."

### `JsonSanitizer`
AI models don't always return perfectly valid JSON. `JsonSanitizer.ExtractJson`:
1. Strips markdown code fences (` ```json ... ``` `).
2. Finds the outermost `[...]` or `{...}` boundary.
3. Walks the JSON string and escapes bare control characters (`\n`, `\t`, `\r`) that the AI embedded literally inside string values.
4. Handles invalid escape sequences (e.g., `\ ` = backslash-space) by doubling the backslash.

### Five AI Tasks

| Task | Input | Output |
|---|---|---|
| `IQuestionGenerator` | Resume text + count + role + sessionType | Array of questions (MCQ/Short/Long/Coding) |
| `IAnswerEvaluator` | Q&A pairs | Per-question scores + overall score + summary |
| `IResumeAnalyser` | Resume text | Section scores, strengths, gaps, ATS tips |
| `IResumeAnalyser.AnalyseJobMatchAsync` | Resume + job description | Match %, keywords, recommendations |
| `IResumeAnalyser.GenerateCoverLetterAsync` | Resume + job description | Cover letter text |
| `IBehavioralQuestionGenerator` | Topic + count | STAR behavioral questions with hints |

### Coding Mode
When `sessionType == "Coding"`, the prompt changes entirely — instead of a mixed question set, it generates DSA problems with sample inputs/outputs and constraints. The Monaco editor in the frontend renders the code answer area.

---

## 6. Authentication & Security

### JWT (JSON Web Token)
- After login, the server issues a signed token.
- The frontend stores it in memory (React context) and sends it in every request: `Authorization: Bearer <token>`.
- The token encodes: `userId`, `email`, `name`, `roles`, `expiry`.
- Signed with a secret key — the server verifies the signature on every request without touching the database.

**Structure:** `header.payload.signature` — base64url encoded.

### `JwtTokenGenerator`
Uses `System.IdentityModel.Tokens.Jwt` to create tokens:
```csharp
new JwtSecurityToken(
    claims: [...],
    expires: DateTime.UtcNow.AddHours(24),
    signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
);
```

### OTP (One-Time Password) Email Verification
- On registration, a 6-digit code is emailed.
- Stored in `EmailOtps` table with expiry (10 minutes) and `IsUsed` flag.
- On verify, the code is checked and marked used.
- Same flow for password reset — OTP → new password.

### Password Reset Flow
1. User enters email → server sends OTP.
2. User enters OTP → server issues a short-lived reset token.
3. User enters new password + reset token → server updates hash.

### `[Authorize]` attribute
Applied to all protected controllers/actions. ASP.NET Core reads the JWT, validates the signature, and populates `User.Claims`. If invalid/missing → 401 Unauthorized.

### `ClaimTypes.NameIdentifier`
The userId is stored in this claim. Controllers extract it:
```csharp
var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
var userId = Guid.Parse(raw);
```

### Share Tokens
- A session can be shared via a unique token (`Guid.NewGuid().ToString("N")` = 32 hex chars).
- Public endpoints (`/api/public/interview/:token`) require no auth.
- Lets others attempt the same questions or view the report.

---

## 7. File Handling

### PDF Upload
- Browser sends multipart/form-data POST.
- ASP.NET receives as `IFormFile`.
- Saved to disk (`/uploads/` folder) via `IFileStorage` / `LocalFileStorage`.
- File path stored in `AppResume.StoredPath`.

### PdfPig (PDF Text Extraction)
- `UglyToad.PdfPig` — open-source .NET PDF library.
- Reads every page, extracts text blocks, joins them with newlines.
- Stored in `AppResume.ExtractedText`.
- If the PDF is image-only (scanned), `ExtractedText` is empty → status = `TextExtractionFailed`.

---

## 8. Frontend — React + TypeScript

### React 19
- UI library from Meta. Renders components to the DOM.
- **Hooks** used throughout:
  - `useState` — local component state.
  - `useEffect` — side effects (fetch data on mount, set up timers).
  - `useRef` — mutable values that don't trigger re-renders (timers, speech recognition instance).
  - `useParams` — read URL params like `/interview/:id`.
  - `useNavigate` — programmatic navigation.
  - `useSearchParams` — read query string like `?timed=60`.

### TypeScript
- Typed superset of JavaScript. Catches bugs at compile time.
- All API response shapes defined in `src/api/types.ts` as `interface`.
- `npx tsc --noEmit` runs the type checker without emitting JS.

### Vite
- Build tool and dev server. Replaces Create React App.
- Extremely fast HMR (Hot Module Replacement) during development.
- Builds optimized bundles for production (`npm run build` → `dist/`).
- `VITE_API_URL` environment variable used to point at the backend.

### React Router v6
- Client-side routing — no page reloads when navigating.
- `BrowserRouter` wraps the whole app.
- `Routes` + `Route` define the mapping: `path="/interview/:id"` → `<InterviewPage />`.
- `ProtectedRoute` wraps routes that require login — redirects to `/login` if no token.
- **SPA routing problem on Render:** Static servers return 404 for deep paths. Fixed with a Render Rewrite rule: `/* → /index.html`.

### Context API
`AuthContext` stores the logged-in user and token globally:
```tsx
const { user, token, signIn, signOut } = useAuth()
```
Any component can read auth state without prop drilling.

### Component structure
```
src/
  api/          ← fetch functions (analytics.ts, behavioral.ts, sessions.ts...)
  components/   ← NavBar, ProtectedRoute, PasswordInput, OtpInput
  context/      ← AuthContext
  pages/        ← one file per route
  index.css     ← all styles (no CSS modules)
  App.tsx       ← route definitions
  main.tsx      ← ReactDOM.createRoot entry point
```

---

## 9. Frontend Libraries

### recharts
- React charting library built on D3.
- Used in `AnalyticsPage`:
  - `LineChart` + `Line` → score trend over time.
  - `BarChart` + `Bar` + `Cell` → category scores (colored by performance).
- `ResponsiveContainer` makes charts fill their parent width.
- `Tooltip`, `XAxis`, `YAxis`, `CartesianGrid` — standard chart anatomy.

### @monaco-editor/react
- VS Code's editor embedded in React.
- Used in `InterviewPage` for Coding questions.
- `theme="vs-dark"`, `defaultLanguage="javascript"`, `height="320px"`.
- `onChange` callback updates answer state on every keystroke.

### react-router-dom
- `Link` — renders an `<a>` without page reload.
- `useNavigate` — imperative navigation (`navigate('/report/123')`).
- `useParams` — typed access to URL segments.
- `useSearchParams` — read/write query string parameters.

### Web Speech API (browser built-in)
- Not a library — a native browser API.
- `SpeechRecognition` / `webkitSpeechRecognition` — converts microphone audio to text in real time.
- `interimResults: true` — shows partial transcription as the user speaks.
- `continuous: true` — keeps listening until explicitly stopped.
- Used in `InterviewPage` and `VoiceInterviewPage`.

---

## 10. API Communication

### Fetch API
All HTTP calls use the browser's native `fetch`. No axios.

Pattern in every `api/*.ts` file:
```typescript
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}
```
- Generic `<T>` means the caller gets a typed result.
- Error is extracted from the API's `{ errors: string[] }` shape.

### `VITE_API_URL`
- In development: empty string → calls go to the same origin (`/api/...`).
- In production (Render): set to `https://interview-simulator-api.onrender.com`.
- Read at build time: `import.meta.env.VITE_API_URL`.

### REST conventions followed

| Method | Path | Meaning |
|---|---|---|
| GET | `/api/sessions` | List all |
| POST | `/api/sessions` | Create |
| GET | `/api/sessions/:id` | Get one |
| POST | `/api/sessions/:id/submit` | Action (not a resource) |
| GET | `/api/sessions/:id/report` | Sub-resource |
| POST | `/api/sessions/:id/share` | Action |

---

## 11. Deployment — Render

### Two Render services

**Web Service (API):**
- Build command: `dotnet publish src/API -c Release -o out`
- Start command: `dotnet out/InterviewSimulator.API.dll`
- Environment variables: `ConnectionStrings__DefaultConnection`, `Jwt__Key`, `Groq__ApiKey`, etc.

**Static Site (Frontend):**
- Build command: `cd src/WebUI && npm install && npm run build`
- Publish directory: `src/WebUI/dist`
- Rewrite rule: `/* → /index.html` (fixes SPA deep-link routing)

### Neon PostgreSQL
- Serverless Postgres — scales to zero when idle (free tier).
- Connection string passed as environment variable on Render.
- EF Core runs migrations on startup (or via `dotnet ef database update` locally).

### Environment variable pattern
`appsettings.json` uses colon notation: `"Jwt:Key"`.  
Render uses double underscore for nested keys: `Jwt__Key`.  
ASP.NET Core's configuration system treats `__` as `:` automatically.

---

## 12. Key Patterns & Concepts

### Repository / Service pattern
Controllers don't touch the database directly. They call a service interface:
```
Controller → ISessionService → SessionService → DbContext → PostgreSQL
```
Benefit: if you switch from EF Core to Dapper, only `SessionService` changes.

### DTO (Data Transfer Object)
Models returned from the API are separate from database entities:
- `AppInterviewSession` = database entity (has navigation properties, EF annotations).
- `SessionResponse` = DTO (plain properties, serialized to JSON for the client).

This decouples your API contract from your database schema.

### Result pattern
`CreateSessionResult` and `ServiceResult` carry either success data or error messages:
```csharp
return CreateSessionResult.Failure("Resume not found.");
return CreateSessionResult.Success(sessionResponse);
```
No exceptions for expected failures (not-found, validation errors).

### Cascading timer pattern (InterviewPage)
```
startTimeRef (Date.now()) → setInterval every 1s → setElapsed(seconds)
```
`useRef` holds the start time so it's not reset on re-renders. `useState` holds elapsed for display.

### Timed mode (countdown per question)
`?timed=60` in the URL → `useSearchParams` reads it → `useEffect` starts a per-question countdown → auto-advances when it hits 0.

### Streak calculation
```
today → yesterday → day before yesterday → ...
Stop when a day has no completed interview.
```
Implemented by building a `HashSet<DateOnly>` of all completion dates, then walking backwards from today.

### JSON in DB columns (behavioral sessions)
Rather than creating FK tables for behavioral questions and feedback, they're stored as JSON strings. This avoids complex schema changes and is readable as plain text in the DB. Trade-off: no SQL querying on the inner fields.

### Share token pattern
```
POST /api/sessions/:id/share → generates token → stored in DB
GET  /api/public/interview/:token → no auth required → returns data
```
The token is opaque (32 hex chars) — impossible to guess, no JWT needed.

---

## 13. All NuGet Packages

| Package | Purpose |
|---|---|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Validates JWT on every request |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | User management + password hashing |
| `Microsoft.EntityFrameworkCore` | ORM core |
| `Microsoft.EntityFrameworkCore.Design` | `dotnet ef` CLI tools |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | EF Core driver for PostgreSQL |
| `UglyToad.PdfPig` | PDF text extraction |
| `System.IdentityModel.Tokens.Jwt` | JWT creation and parsing |
| `Microsoft.IdentityModel.Tokens` | Signing credentials, token validation |
| `SendGrid` | Email via SendGrid |
| `System.Net.Http.Json` | `PostAsJsonAsync`, `ReadFromJsonAsync` helpers |

---

## 14. All npm Packages

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `typescript` | Type safety |
| `vite` | Build tool + dev server |
| `@vitejs/plugin-react` | Vite React plugin (JSX transform) |
| `react-router-dom` | Client-side routing |
| `recharts` | Line + bar charts (analytics page) |
| `@monaco-editor/react` | VS Code editor embedded in React |

---

## 15. Interview Q&A Cheatsheet

**Q: Why Clean Architecture?**  
A: Separation of concerns. Business logic (Application) has no dependency on the database or AI provider. You can swap Groq for OpenAI, or Postgres for SQL Server, by changing one DI registration.

**Q: How does JWT authentication work?**  
A: On login the server creates a signed token containing the userId and roles. The frontend sends it in every request header. The server verifies the signature — no DB lookup needed per request.

**Q: What happens if the AI returns malformed JSON?**  
A: `JsonSanitizer` strips markdown fences, finds the JSON boundaries, and walks the string to escape control characters and fix invalid escape sequences before deserializing.

**Q: Why store behavioral questions as JSON in a text column instead of a proper table?**  
A: Behavioral sessions have no resume FK and a variable number of questions. A separate questions table would require nullable FKs or a polymorphic association. JSON columns keep the schema simple for this use case. Trade-off: can't SQL-query individual fields.

**Q: How does the streak work?**  
A: Build a `HashSet<DateOnly>` of all days where at least one interview was completed. Walk backwards from today — increment streak while consecutive days are in the set.

**Q: How does voice recognition work?**  
A: Web Speech API (`SpeechRecognition`) streams audio to the browser's speech engine. With `interimResults: true` the transcript appears word by word. Final results are appended to the answer text.

**Q: What is a migration and why do you need it?**  
A: A migration is a versioned, reversible description of a schema change (add column, create table). EF Core applies them in order so the database schema always matches the C# models. Without migrations, you'd have to write ALTER TABLE SQL by hand and coordinate it across environments.

**Q: Why Groq instead of OpenAI?**  
A: Groq's free tier is generous for development, and their LPU hardware makes inference significantly faster than OpenAI's hosted models. The API is OpenAI-compatible so switching is a one-line DI change.

**Q: How does the timed interview work?**  
A: The interview URL includes `?timed=60`. `useSearchParams` reads it. A `useEffect` that depends on `currentIndex` starts a fresh countdown whenever the question changes. When it reaches zero, `setCurrentIndex(i + 1)` auto-advances.

**Q: How does the Monaco editor know the answer changed?**  
A: Monaco's `onChange` prop fires on every keystroke with the full current value. The handler calls `setAnswer(questionId, value)` to update React state, same as a normal textarea's `onChange`.

**Q: What is CORS and why does it matter here?**  
A: Browsers block JavaScript from calling an API on a different domain (the frontend is on `interview-simulator-ui.onrender.com`, API is on `interview-simulator-api.onrender.com`). The API must respond with `Access-Control-Allow-Origin` headers listing the frontend domain — configured in `AddCors()`.
