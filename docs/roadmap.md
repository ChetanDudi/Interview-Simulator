# Build Roadmap

## Phase 1: Foundation

- Create solution structure
- Define project boundaries
- Add initial documentation
- Add docs, docker, and tests scaffolding

## Phase 2: Authentication

- User, Role, and UserRole entities
- Password hashing
- JWT authentication
- Role-based authorization
- Register and login endpoints

## Phase 3: Database Foundation

- Configure PostgreSQL integration
- Add EF Core migrations
- Keep provider-specific code isolated in `Persistence`
- Prepare abstractions so future database changes stay localized

## Phase 4: Resume Analyzer

- Resume upload endpoint
- PDF text extraction
- Resume storage model
- Persist raw resume text

## Phase 5: Skill Extraction

- Convert resume text into structured skill data
- Store extracted skills for interview generation
- Handle skill normalization and duplicates

## Phase 6: Interview Engine

- Interview session lifecycle
- Question generation by skill and difficulty
- Question and answer persistence

## Phase 7: Real-Time Experience

- SignalR hub for live interview flow
- Stream questions and answers in real time
- Session state updates

## Phase 8: Speech and Evaluation

- Speech-to-text integration
- Technical answer evaluation
- Communication feedback
- Confidence metrics such as filler words and pace

## Phase 9: Reporting and Delivery

- Final AI feedback report
- Score aggregation
- Docker support
- CI/CD setup

## Phase 10: Scale and Delivery Optimization

- Add cache design where appropriate
- Add CDN strategy for frontend/static assets
- Prepare production deployment topology
- Add health checks and operational guidance

## Architecture Notes

- `Domain`: Core entities and business rules
- `Application`: Use cases, interfaces, DTOs
- `Infrastructure`: External services such as AI and speech integrations
- `Persistence`: EF Core and database access
- `API`: HTTP endpoints and authentication
- `WebUI`: Frontend client for upload, interview, and reporting

## Architecture Decision

- We reviewed whether to merge `Persistence` into `Infrastructure`.
- Final decision: keep `Persistence` separate.
- Reason: for this project, separating database concerns from AI, storage, speech, and real-time integrations keeps boundaries clearer and safer as the system grows.
