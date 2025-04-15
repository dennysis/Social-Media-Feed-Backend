const dotenv = require('dotenv');
const path = require('path');


const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

if (result.error) {
  console.error('Error loading .env.test file:', result.error);

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://superchat.01_owner:npg_uj7yLbRm6FEK@ep-plain-bird-a52pg3id-pooler.us-east-2.aws.neon.tech/superchat.01?sslmode=require";
    console.log('Set DATABASE_URL directly from hardcoded value');
  }
  
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test_secret_key";
    console.log('Set JWT_SECRET directly from hardcoded value');
  }
} else {
  console.log('Successfully loaded .env.test file');
}

console.log('Jest setup: Test database URL:', process.env.DATABASE_URL);
