# Database Guide

This guide explains how to connect to and browse the PostgreSQL database used by Interview Simulator.

---

## Your Database Details

| Setting  | Value                        |
|----------|------------------------------|
| Host     | localhost                    |
| Port     | 5432                         |
| Database | interview_simulator_dev      |
| Username | postgres                     |
| Password | whatever you set in user-secrets |

---

## Option 1 — pgAdmin (Recommended GUI, Free)

pgAdmin is the official PostgreSQL GUI. It is installed alongside PostgreSQL on Windows.

### How to open it

Search **pgAdmin 4** in the Windows Start menu and open it.
It opens in your browser at `http://127.0.0.1:port`.

### Connect to your database

1. In the left sidebar, expand **Servers**
2. If no server is listed, right-click **Servers → Register → Server**
3. Fill in:
   - **Name:** `InterviewSimulator Dev` (any label you want)
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Username:** `postgres`
   - **Password:** your postgres password
4. Click **Save**

### Browse tables

```
Servers
  └── InterviewSimulator Dev
        └── Databases
              └── interview_simulator_dev
                    └── Schemas
                          └── public
                                └── Tables
                                      ├── Users
                                      ├── Roles
                                      ├── UserRoles
                                      ├── UserClaims
                                      ├── UserLogins
                                      ├── UserTokens
                                      └── RoleClaims
```

Right-click any table → **View/Edit Data → All Rows** to see the contents.

### Run a query in pgAdmin

Right-click the database `interview_simulator_dev` → **Query Tool**
Then paste and run any SQL from the section below.

---

## Option 2 — psql (Command Line, Built-In)

psql is the PostgreSQL command-line client. It ships with PostgreSQL.

### Open a psql session

```powershell
psql -U postgres -d interview_simulator_dev
```

Type your postgres password when prompted.

### Useful psql commands

```sql
-- List all tables
\dt

-- Describe a table's columns
\d "Users"

-- Exit
\q
```

---

## Option 3 — DBeaver (Free, Works With Any Database)

DBeaver is a free universal database GUI that works great with PostgreSQL.

Download from: https://dbeaver.io/download/

### Connect

1. Click **New Database Connection** (plug icon top-left)
2. Choose **PostgreSQL**
3. Fill in:
   - Host: `localhost`
   - Port: `5432`
   - Database: `interview_simulator_dev`
   - Username: `postgres`
   - Password: your postgres password
4. Click **Test Connection** then **Finish**

---

## Option 4 — VS Code Extension (SQLTools)

Install the **SQLTools** extension + **SQLTools PostgreSQL Driver** from the VS Code extensions panel.

Then add a connection:
- Driver: PostgreSQL
- Host: localhost
- Port: 5432
- Database: interview_simulator_dev
- Username: postgres
- Password: your postgres password

---

## Tables In This Project

All tables are in the `public` schema.

### Users

Stores every registered user account.

| Column            | Type      | Notes                              |
|-------------------|-----------|------------------------------------|
| Id                | uuid      | Primary key                        |
| Name              | varchar   | Full name (custom field)           |
| CreatedAtUtc      | timestamp | When the account was created       |
| UserName          | varchar   | Same as email                      |
| Email             | varchar   | Login email                        |
| NormalizedEmail   | varchar   | Uppercase email (used for lookups) |
| PasswordHash      | text      | bcrypt hash — never a plain text password |
| EmailConfirmed    | bool      | Always false until email verify is added |
| LockoutEnabled    | bool      | Lockout support                    |
| AccessFailedCount | int       | Failed login counter               |

### Roles

Stores role definitions.

| Column | Type    | Notes                     |
|--------|---------|---------------------------|
| Id     | uuid    | Primary key               |
| Name   | varchar | e.g. `Candidate`          |
| Description | varchar | Optional description |

### UserRoles

Links users to roles (many-to-many join table).

| Column | Type | Notes                   |
|--------|------|-------------------------|
| UserId | uuid | FK → Users.Id           |
| RoleId | uuid | FK → Roles.Id           |

### Other Tables

| Table       | Purpose                                      |
|-------------|----------------------------------------------|
| UserClaims  | Extra claims attached to a user              |
| UserLogins  | External login providers (Google, etc.)      |
| UserTokens  | Tokens issued to users (refresh tokens etc.) |
| RoleClaims  | Claims attached to a role                    |

These are empty unless external login or token features are added later.

---

## Useful SQL Queries

Paste these into pgAdmin Query Tool or psql.

### See all registered users

```sql
SELECT "Id", "Name", "Email", "CreatedAtUtc", "EmailConfirmed"
FROM "Users"
ORDER BY "CreatedAtUtc" DESC;
```

### See all roles

```sql
SELECT "Id", "Name", "Description"
FROM "Roles";
```

### See which users have which roles

```sql
SELECT u."Name", u."Email", r."Name" AS "Role"
FROM "UserRoles" ur
JOIN "Users"  u ON u."Id" = ur."UserId"
JOIN "Roles"  r ON r."Id" = ur."RoleId"
ORDER BY u."Email";
```

### Count registered users

```sql
SELECT COUNT(*) FROM "Users";
```

### Find a specific user by email

```sql
SELECT "Id", "Name", "Email", "CreatedAtUtc"
FROM "Users"
WHERE "Email" = 'you@example.com';
```

### Delete a test user (by email)

```sql
DELETE FROM "Users"
WHERE "Email" = 'test@example.com';
```

---

## Reset The Dev Database (Nuclear Option)

Only use this if you want to wipe everything and start fresh.

```powershell
# Drop the database
psql -U postgres -c "DROP DATABASE interview_simulator_dev;"

# Recreate it
psql -U postgres -c "CREATE DATABASE interview_simulator_dev;"

# Re-apply all migrations
dotnet ef database update --project .\src\Persistence\InterviewSimulator.Persistence.csproj --startup-project .\src\API\InterviewSimulator.API.csproj
```

---

## Why Passwords Are Not Visible

The `PasswordHash` column contains a bcrypt hash like:

```
$2a$11$abc123xyz...
```

This is by design — ASP.NET Identity hashes passwords before storing them.
There is no way to reverse it back to the plain text password.
If you need to test login, register a new user through the app or the API.
