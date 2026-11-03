import { useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Workspace, { type Section } from "./components/Workspace";
import CargosPage from "./pages/CargosPage";
import OverviewPage from "./pages/OverviewPage";
import TripsPage from "./pages/TripsPage";
import TrucksPage from "./pages/TrucksPage";
import { ApiError, api } from "./lib/api";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [checkingSession, setCheckingSession] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    let active = true;
    api<{ user: User }>("/auth/me").then(({ user: currentUser }) => {
      if (active) setUser(currentUser);
    }).catch((error: unknown) => {
      if (active && !(error instanceof ApiError && error.status === 401)) {
        setConnectionError(error instanceof Error ? error.message : "Serverga ulanib bo'lmadi.");
      }
    }).finally(() => {
      if (active) setCheckingSession(false);
    });
    return () => { active = false; };
  }, []);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Server bilan bog'lanib bo'lmadi.");
    } finally {
      setUser(null);
      setSection("overview");
    }
  }

  if (checkingSession) {
    return <main className="boot-screen"><span className="boot-mark">Y</span><span>YUKBOR ish maydoni ochilmoqda...</span></main>;
  }

  if (!user) {
    return (
      <>
        {connectionError && <div role="alert" className="connection-banner">{connectionError} API server ishga tushganini tekshiring.</div>}
        <AuthScreen onAuthenticated={(authenticatedUser) => { setUser(authenticatedUser); setConnectionError(""); }} />
      </>
    );
  }

  return (
    <Workspace user={user} section={section} onNavigate={setSection} onLogout={() => { void logout(); }}>
      {section === "overview" && <OverviewPage user={user} onNavigate={setSection} />}
      {section === "cargos" && <CargosPage user={user} />}
      {section === "trucks" && <TrucksPage user={user} />}
      {section === "trips" && <TripsPage />}
    </Workspace>
  );
}
