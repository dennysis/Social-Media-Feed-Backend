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
   EMAIL_HOST="smtp.example.com"
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER="your_email@example.com"
   EMAIL_PASSWORD="your_email_password"
   EMAIL_FROM="Social Media App <noreply@socialmedia.com>"
   FRONTEND_URL="http://localhost:3000"
   ```
4. **Set Up Database with Prisma:**
   Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
5. **Start the server:**
   ```bash
   npm run dev
   ```

## Architectural Decisions
- Express: Used as the HTTP server and middleware manager.
- GraphQL: Enables flexible queries and mutations.
- Prisma & PostgreSQL: Provides a type-safe, robust ORM with migrations.
- TypeScript: Ensures type safety across the codebase
- Nodemailer: For sending transactional emails

## Features
- User registration and login with JWT authentication.
- Welcome email sent to users upon registration.
- Password reset functionality with secure token-based verification.
- Creating posts.
- Liking posts.
- Following/unfollowing users.

## API Endpoints

### REST API
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email and password
- `POST /auth/logout` - Logout (client-side token removal)
- `POST /auth/forgot-password` - Request a password reset link
- `POST /auth/reset-password` - Reset password with token

### GraphQL API
Access the GraphQL playground at `/graphql` when running in development mode.

#### Queries:
- `me` - Get the current authenticated user
- `user(id: ID!)` - Get a user by ID

#### Mutations:
- `register(username: String!, email: String!, password: String!)` - Register a new user
- `login(email: String!, password: String!)` - Login with email and password
- `requestPasswordReset(email: String!)` - Request a password reset
- `resetPassword(token: String!, newPassword: String!)` - Reset password with token
- `followUser(userId: ID!)` - Follow a user
- `unfollowUser(userId: ID!)` - Unfollow a user
- `likePost(postId: ID!)` - Like a post
- `unlikePost(postId: ID!)` - Unlike a post
