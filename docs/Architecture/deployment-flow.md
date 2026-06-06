# Deployment Flow

## Local Development

`WebUI -> API -> PostgreSQL`

Later optional local services:

- Redis
- local object storage emulator or filesystem storage

## Production

`User -> CDN -> WebUI static assets`

`User -> Reverse Proxy -> API`

`API -> Cache`

`API -> Database`

`API -> Storage`

`API -> AI and Speech providers`

## Key Design Rule

The API must remain the control point for:

- authentication
- authorization
- validation
- file access control
- interview session ownership
