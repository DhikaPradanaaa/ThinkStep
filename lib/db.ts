import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logOptions: any[] = isDevelopment ? ['error', 'warn'] : ['error'];

  // 1. Jika ada kredensial Turso, gunakan Turso (untuk Vercel/Produksi)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return new PrismaClient({
      adapter,
      log: logOptions,
    })
  }

  // 2. Jika tidak ada kredensial Turso, gunakan SQLite lokal (untuk Development)
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`
  })
  
  return new PrismaClient({
    adapter,
    log: logOptions,
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
