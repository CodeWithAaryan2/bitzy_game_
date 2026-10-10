import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App as CapacitorApp } from "@capacitor/app";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import { supabase } from "@/lib/supabase";
import App from "./App.tsx";
import { initAdMob } from "@/lib/ads";

// Only run Capacitor StatusBar on native (not web)
async function setupStatusBar() {
  try {
    const { Capacitor } = await import("@capacitor/core");

    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import("@capacitor/status-bar");

    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // Ignore on web
  }
}

// Handle OAuth Deep Links
CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
  console.log("OAuth Callback URL:", url);

  if (url.startsWith("com.bitzy.app://auth")) {
    // THE REAL BUG: supabase-js's exchangeCodeForSession(authCode) expects
    // ONLY the bare auth code string (e.g. "34e770dd-...") — it does NOT
    // parse a URL. We were passing it the *entire* deep link
    // ("com.bitzy.app://auth?code=...&..."), so Supabase sent that whole
    // string to the token endpoint as if it were the code. The server
    // rejected it as invalid, exchangeCodeForSession returned an error,
    // and we fell into the catch branch that sends you to
    // /login?error=oauth_failed — which is exactly the "picks account,
    // then dumped back on login" symptom.
    const code = new URL(url).searchParams.get("code");

    if (!code) {
      console.error("OAuth callback missing code param:", url);
      window.location.href = "/login?error=oauth_failed";
      return;
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // Close the system browser tab that Google OAuth ran in (opened via
    // @capacitor/browser in AuthContext.loginWithGoogle) — otherwise it
    // stays open on top of the app after the deep link fires.
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.close();
    } catch {
      // no-op on web / if already closed
    }

    if (error) {
      console.error("OAuth session exchange failed:", error.message);
      window.location.href = "/login?error=oauth_failed";
      return;
    }

    console.log("OAuth session established:", data.session?.user?.id);
    window.location.href = "/app/dashboard";
  }
});

setupStatusBar();
initAdMob();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>
);