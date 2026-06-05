import path from 'node:path'
import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv';
import fs from 'fs';

// Coba load .env.local dulu, lalu .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const dbPath = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL || dbPath,
  },
})
