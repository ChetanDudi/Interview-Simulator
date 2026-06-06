# Commands And Setup

Use `PowerShell` from:

```powershell
cd C:\Users\CHETAN DUDI\OneDrive\Desktop\Project
```

## Terminal

Recommended terminal:

- `PowerShell`

Also works:

- `cmd`

Use `PowerShell` by default in this project because the docs and commands are written for it.

## One-Time Installs

### Check .NET

```powershell
dotnet --version
dotnet --list-sdks
```

### Install EF Core CLI

```powershell
dotnet tool install --global dotnet-ef
```

### Check PostgreSQL Client

```powershell
psql --version
```

## Local Secret Setup

Run once:

```powershell
dotnet user-secrets init --project .\src\API\InterviewSimulator.API.csproj
```

Save your PostgreSQL connection:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=interview_simulator_dev;Username=postgres;Password=YOUR_REAL_POSTGRES_PASSWORD" --project .\src\API\InterviewSimulator.API.csproj
```

Save your JWT key:

```powershell
dotnet user-secrets set "Jwt:Key" "replace-this-with-a-long-random-development-secret-key-at-least-32-characters" --project .\src\API\InterviewSimulator.API.csproj
```

Check saved secrets:

```powershell
dotnet user-secrets list --project .\src\API\InterviewSimulator.API.csproj
```

## First-Time Project Setup

Run in this order:

```powershell
dotnet restore .\src\API\InterviewSimulator.API.csproj
dotnet build .\src\API\InterviewSimulator.API.csproj
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

## Build Commands

### Build API

```powershell
dotnet build .\src\API\InterviewSimulator.API.csproj
```

### Build Persistence

```powershell
dotnet build .\src\Persistence\InterviewSimulator.Persistence.csproj
```

### Build Domain

```powershell
dotnet build .\src\Domain\InterviewSimulator.Domain.csproj
```

### Build Entire Solution

```powershell
dotnet build .\InterviewSimulator.slnx
```

## Run Commands

### Run API

```powershell
dotnet run --project .\src\API\InterviewSimulator.API.csproj
```

### Run API With Hot Reload

```powershell
dotnet watch --project .\src\API\InterviewSimulator.API.csproj run
```

## Local URLs

When the API starts, watch the console for:

```text
Now listening on: http://localhost:5256
```

Example health check:

```text
http://localhost:5256/api/system/ping
```

## Database Commands

### Add New Migration

Use this only when entity or DB model changes are made:

```powershell
dotnet ef migrations add MigrationName --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

Example:

```powershell
dotnet ef migrations add AddResumeTables --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

### Apply Migrations

```powershell
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

### Remove Last Migration

Use only if it has not been applied in shared environments:

```powershell
dotnet ef migrations remove --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

## Package Commands

### Add Package To API

```powershell
dotnet add .\src\API\InterviewSimulator.API.csproj package PackageName
```

### Add Package To Persistence

```powershell
dotnet add .\src\Persistence\InterviewSimulator.Persistence.csproj package PackageName
```

### Restore After Package Changes

```powershell
dotnet restore .\src\API\InterviewSimulator.API.csproj
```

## Testing API Endpoints

### Browser Test

Open:

```text
http://localhost:5256/api/system/ping
```

### Using The `.http` File

Use:

- `src/API/InterviewSimulator.API.http`

### Tools

You can also use:

- Postman
- Thunder Client

## Frontend (WebUI) Commands

### Install Node Packages (first time only)

```powershell
cd .\src\WebUI
npm install
```

### Run Frontend Dev Server

```powershell
cd .\src\WebUI
npm run dev
```

Opens at: `http://localhost:5173`

The `/api` prefix is proxied to `http://localhost:5256` (backend) automatically.

### Build Frontend For Production

```powershell
cd .\src\WebUI
npm run build
```

Output goes to `src/WebUI/dist/`.

### Type-Check Frontend Without Building

```powershell
cd .\src\WebUI
npx tsc --noEmit
```

## Running Both Servers Together

Open **two** PowerShell terminals, both from the project root:

**Terminal 1 — Backend API:**

```powershell
cd C:\Users\CHETAN DUDI\OneDrive\Desktop\Project
dotnet run --project .\src\API\InterviewSimulator.API.csproj
```

**Terminal 2 — Frontend:**

```powershell
cd C:\Users\CHETAN DUDI\OneDrive\Desktop\Project\src\WebUI
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Daily Developer Flow

Normal day-to-day order:

1. Open two `PowerShell` windows
2. Go to the project root in both
3. In terminal 1: build and run the backend API
4. In terminal 2: run the frontend dev server
5. Apply database migrations if any changed

**Terminal 1 — API:**

```powershell
cd C:\Users\CHETAN DUDI\OneDrive\Desktop\Project
dotnet build .\src\API\InterviewSimulator.API.csproj
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
dotnet run --project .\src\API\InterviewSimulator.API.csproj
```

**Terminal 2 — Frontend:**

```powershell
cd C:\Users\CHETAN DUDI\OneDrive\Desktop\Project\src\WebUI
npm run dev
```

## OpenAI API Key Setup

Set your OpenAI API key in user-secrets (get one from platform.openai.com):

```powershell
dotnet user-secrets set "OpenAi:ApiKey" "sk-proj-your-key-here" --project .\src\API\InterviewSimulator.API.csproj
```

To use a different model (default is `gpt-4o-mini`):

```powershell
dotnet user-secrets set "OpenAi:Model" "gpt-4o" --project .\src\API\InterviewSimulator.API.csproj
```

## Sessions Migration

After adding AI features, run once to create the session tables:

```powershell
dotnet ef migrations add AddSessionsTables --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

This migration also adds the `ExtractedText` column to the `Resumes` table.

## OTP Migration

After adding the OTP feature, run once to create the `EmailOtps` table:

```powershell
dotnet ef migrations add AddEmailOtpsTable --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

## Email Configuration

### Development (default — no SMTP needed)

The default provider is `Console`. OTPs are printed directly in the API terminal window in yellow — no email setup needed.

### Production (SMTP)

Set `Email:Provider = "Smtp"` in appsettings and store credentials in user-secrets:

```powershell
dotnet user-secrets set "Email:Provider" "Smtp" --project .\src\API\InterviewSimulator.API.csproj
dotnet user-secrets set "Email:Smtp:Host" "smtp.gmail.com" --project .\src\API\InterviewSimulator.API.csproj
dotnet user-secrets set "Email:Smtp:Port" "587" --project .\src\API\InterviewSimulator.API.csproj
dotnet user-secrets set "Email:Smtp:Username" "your@gmail.com" --project .\src\API\InterviewSimulator.API.csproj
dotnet user-secrets set "Email:Smtp:Password" "your-app-password" --project .\src\API\InterviewSimulator.API.csproj
```

## Resume Migration

After pulling the resume upload changes, run this once to create the `Resumes` table:

```powershell
dotnet ef migrations add AddResumesTable --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

Uploaded files are saved to `src/API/uploads/resumes/{userId}/` when running with `dotnet run`.

## Troubleshooting

### If the database password fails

Reset your local secret:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=interview_simulator_dev;Username=postgres;Password=YOUR_REAL_POSTGRES_PASSWORD" --project .\src\API\InterviewSimulator.API.csproj
```

### If the API port changes

Check the console output after `dotnet run`.

### If migrations say a name already exists

That means the migration was already created.
Usually the next command should be:

```powershell
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

### If the database is already up to date

That is fine. It means your schema already matches the current migrations.
