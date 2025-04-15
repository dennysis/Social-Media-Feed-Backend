import { PrismaClient } from '@prisma/client';


const isTest = process.env.NODE_ENV === 'test'


const databaseUrl = isTest 
  ? process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/social_media_test'
  : process.env.DATABASE_URL 



const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'test' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma
