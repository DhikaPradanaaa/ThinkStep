import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user?.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          gradeLevel: user.gradeLevel,
          avatarColor: user.avatarColor,
          onboardingCompleted: user.onboardingCompleted,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.schoolId = (user as any).schoolId
        token.gradeLevel = (user as any).gradeLevel
        token.avatarColor = (user as any).avatarColor
        token.onboardingCompleted = (user as any).onboardingCompleted
      }
      if (trigger === 'update' && session) {
        if (session.role) token.role = session.role
        if (session.gradeLevel) token.gradeLevel = session.gradeLevel
        token.onboardingCompleted = true
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).schoolId = token.schoolId
        ;(session.user as any).gradeLevel = token.gradeLevel
        ;(session.user as any).avatarColor = token.avatarColor
        ;(session.user as any).onboardingCompleted = token.onboardingCompleted
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        // Set onboardingCompleted to false for new users (Google Login)
        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingCompleted: false },
        })
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
})
