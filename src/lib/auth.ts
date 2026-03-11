// lib/auth.ts — NextAuth configuration with Google (+ optional Apple) SSO

import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // Use the Prisma adapter so sessions + accounts are stored in the DB
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Uncomment to enable Apple sign-in
    // AppleProvider({
    //   clientId: process.env.APPLE_ID!,
    //   clientSecret: process.env.APPLE_SECRET!,
    // }),
  ],

  session: { strategy: "database" },

  callbacks: {
    // Expose the user id in the session so we don't have to query by email
    async session({ session, user }) {
      if (session.user) {
        (session.user as typeof session.user & { id: string }).id = user.id;
      }
      return session;
    },

    // After the first sign-in, create a default "Personal" group for the user
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.id) {
        await prisma.group.create({
          data: {
            name: "Personal",
            members: {
              create: { userId: user.id, role: "owner" },
            },
          },
        });
      }
      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};
