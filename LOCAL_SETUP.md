# Local Development Configuration

## Database
- Use pgAdmin to create a database named `webprog`
- Connection string: `postgresql://postgres:postgres@localhost:5433/webprog`
- Set `DATABASE_URL` environment variable to this string.

## Environment Variables
- `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5433/webprog`
- `SESSION_SECRET`: any random string
- `NODE_ENV`: `development`

## Commands
- Install dependencies: `npm install`
- Push schema: `npm run db:push`
- Start dev server: `npm run dev` (runs on port 5000)
