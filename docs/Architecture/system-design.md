# System Design

## Goals

This system should be:

- secure
- easy to deploy
- easy to scale
- easy to extend
- adaptable if the database changes in the future

## Architecture Direction

We are designing the project so that business logic does not depend directly on:

- PostgreSQL
- EF Core-specific query details
- OpenAI
- SignalR
- file storage vendor
- cache vendor

That gives us room to change infrastructure later with less disruption.

## Dependency Rule

Dependencies must point inward:

`API -> Application -> Domain`

`Infrastructure -> Application -> Domain`

`Persistence -> Application -> Domain`

`Domain` must never depend on database, framework, cache, CDN, or AI provider details.

## Database Change Strategy

If we want database flexibility later, we should avoid writing the application around PostgreSQL-specific behavior.

### What we will do

- Keep database access inside `Persistence`.
- Keep use cases in `Application`.
- Keep entity rules in `Domain`.
- Use repository/query abstractions only where they provide real value.
- Keep provider-specific SQL isolated.
- Keep migrations isolated to the persistence layer.
- Keep connection strings and provider settings in configuration only.

### What we should avoid

- PostgreSQL-specific logic leaking into controllers or business rules
- raw SQL spread across the codebase
- directly coupling application code to table names
- storing business rules inside database procedures unless absolutely necessary

### Practical result

If we later move from PostgreSQL to SQL Server or another relational database, we mostly want to replace:

- provider package references
- persistence configuration
- migrations
- some provider-specific queries if any exist

not the entire application.

## Suggested Data Access Pattern

For this project, the best balance is:

- EF Core for standard persistence
- configurations per entity
- application services depending on interfaces or use-case-oriented data contracts
- provider-specific optimizations only in `Persistence`

We do **not** need to over-engineer a generic repository for everything.

A better rule is:

- simple CRUD and aggregates: EF Core through persistence services
- complex reads: query services
- provider-specific tuning: keep inside `Persistence`

## Cache Design

Caching should be layered, not random.

### Cache types we will support

1. Response cache
- For public or semi-static API responses where safe

2. Application cache
- For frequently reused lookups such as skills metadata, prompt templates, config-driven lists, and short-lived interview state helpers

3. Distributed cache
- For scale-out scenarios when multiple API instances run together
- Best future choice: Redis

### What should be cached

- reference data
- repeated AI prompt templates
- temporary session metadata
- non-sensitive dashboard summaries
- generated read models where regeneration is expensive

### What should not be cached carelessly

- raw JWT tokens
- passwords
- highly sensitive user data without encryption and strict TTL
- authorization decisions that could go stale dangerously

## CDN Strategy

CDN is mostly for frontend and static assets, not for private API behavior.

### CDN will be useful for

- frontend static files
- images
- icons
- stylesheets
- JavaScript bundles
- public documentation assets

### CDN should generally not be used for

- authenticated API responses by default
- highly dynamic interview session traffic
- private resume content
- private reports

### Good production flow

`User -> CDN -> WebUI static assets`

`User -> Reverse Proxy / Gateway -> API`

That keeps static delivery fast while sensitive traffic stays controlled.

## Real-Time Flow Design

For live interviews:

`Browser -> API auth -> SignalR hub -> interview session service -> persistence / AI / speech modules`

Important design note:

- real-time message delivery should not be the only source of truth
- session state must still be persisted safely

## File and Resume Storage Design

User uploads such as resumes and later audio files should follow this flow:

`Browser -> API validation -> storage service -> metadata in database`

Rules:

- validate file type
- validate size
- generate server-side filenames
- never trust client filenames
- never execute uploaded files

Future storage options should be swappable:

- local disk for development
- cloud blob/object storage for production

## Production Connectivity Flow

Recommended high-level production flow:

`User Browser`

`-> CDN`

`-> Reverse Proxy / Load Balancer`

`-> API Instances`

`-> Redis cache`

`-> PostgreSQL`

`-> Object storage`

`-> AI providers`

`-> Speech provider`

## Deployment-Friendly Design Rules

To keep deployment easy anywhere:

- keep all secrets in environment variables or secret stores
- do not hardcode ports, hosts, or credentials
- make storage provider configurable
- make cache provider configurable
- make database provider configuration isolated
- keep stateless API nodes where possible
- use health check endpoints
- log to console in containers

## Security in System Design

Security must exist in every layer:

### API

- authentication
- authorization
- rate limiting
- request validation

### Application

- ownership checks
- business rule validation
- audit-worthy operations tracked

### Persistence

- parameterized access
- least-privilege DB user
- safe migrations

### Infrastructure

- provider secrets isolated
- safe retries and timeouts
- no blind trust in AI output

## Future Scalability Plan

If traffic grows, we should be able to scale by:

- adding more API instances
- moving cache to Redis
- moving static assets behind CDN
- moving uploads to object storage
- offloading long-running tasks to background workers

## What This Means For Our Codebase

As we build, we should add these folders and abstractions intentionally:

- `src/Application/Abstractions/Caching`
- `src/Application/Abstractions/Storage`
- `src/Application/Abstractions/AI`
- `src/Persistence/Configurations`
- `src/Persistence/Migrations`
- `src/Infrastructure/Storage`
- `src/Infrastructure/AI`
- `src/Infrastructure/Speech`
- `src/Infrastructure/BackgroundJobs`

This keeps provider changes localized later.
