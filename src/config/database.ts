import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default prisma;
// Add this at the top of your database.ts file
const isTest = process.env.NODE_ENV === 'test'

// Use a different database URL for tests
const databaseUrl = isTest 
  ? process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/social_media_test'
  : process.env.DATABASE_URL 

// Add logging to debug database connection issues
// import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'test' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma
// export default prisma