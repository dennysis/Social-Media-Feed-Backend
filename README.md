# Social Media Backend

This is a basic social media feed backend built using Node.js, Express, GraphQL, Prisma ORM, and PostgreSQL.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd social-media-backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   Create a `.env` file in the root directory and set the following variables:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/social_media_db?schema=public"
    JWT_SECRET="your_jwt_secret_key"
    PORT=4000
    ```
4. **Set Up Database with Prisma:**
     Generate Prisma client and run migrations:
     ```bash
     npx prisma generate
     npx prisma migrate dev
     ```
5. **Start the server:**
   ```
   npm run dev
   ```
## Architectural Decisions
- Express: Used as the HTTP server and middleware manager.

- GraphQL: Enables flexible queries and mutations.

- Prisma & PostgreSQL: Provides a type-safe, robust ORM with migrations.

- TypeScript: Ensures type safety across the codebase


## Features
- User registration and login with JWT authentication.

- Creating posts.

- Liking posts.

- Following/unfollowing users.
