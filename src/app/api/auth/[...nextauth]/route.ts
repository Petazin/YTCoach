import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Defined" : "Undefined");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Defined" : "Undefined");

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT) {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
            });

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        };
    } catch (error) {
        console.error("RefreshAccessTokenError", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            try {
                // Initial sign in
                if (account && user) {
                    return {
                        accessToken: account.access_token,
                        accessTokenExpires: (account.expires_at || 0) * 1000,
                        refreshToken: account.refresh_token,
                        user,
                    };
                }

                // Return previous token if the access token has not expired yet
                // Subtract small buffer (e.g. 10s) to be safe
                if (token.accessTokenExpires && Date.now() < ((token.accessTokenExpires as number) - 10000)) {
                    return token;
                }

                // If no refresh token is available, we can't refresh. 
                // Return the token as is (or with error) so the client can handle sign-out.
                if (!token.refreshToken) {
                    return {
                        ...token,
                        error: "RefreshAccessTokenError", // Force sign-out on client
                    };
                }

                // Access token has expired, try to update it
                return await refreshAccessToken(token);
            } catch (error) {
                console.error("JWT Callback Error:", error);
                return { ...token, error: "JWTCallbackError" };
            }
        },
        async session({ session, token }) {
            try {
                if (token && session?.user) {
                    (session.user as any).accessToken = token.accessToken;
                    (session.user as any).error = token.error;
                }
                return session;
            } catch (error) {
                console.error("Session Callback Error:", error);
                return session;
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
