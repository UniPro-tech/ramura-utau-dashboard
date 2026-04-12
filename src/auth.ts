import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

const trustedUsers = ["957110410891391006", "884399052882583592"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID as string,
      clientSecret: process.env.AUTH_DISCORD_SECRET as string,
    }),
  ],
  basePath: "/api/auth",
  callbacks: {
    signIn({ user, profile }) {
      if (
        trustedUsers.includes(user.id as string) ||
        trustedUsers.includes(profile?.id as string)
      ) {
        return true;
      }
      return false;
    },
    jwt({ token, trigger, session, account }) {
      if (account) {
        token.id = account.providerAccountId;
      }

      if (trigger === "update") token.name = session.name;
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  session: {
    maxAge: 600,
  },
  pages: {
    signIn: "/signin",
  },
});
