import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

// NOTE: Replace this with your actual Google Client ID from Google Cloud Console
// You should ideally put this in your .env file as VITE_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "994461425278-kr30duoour1saobfadobq3dmed87m8fs.apps.googleusercontent.com";

export function GoogleAuthProviderWrapper({ children }: { children: ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
}
