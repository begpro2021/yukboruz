import { useCallback, useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Workspace, { type Section } from "./components/Workspace";
import CargosPage from "./pages/CargosPage";
import LandingPage from "./pages/LandingPage";
import OverviewPage from "./pages/OverviewPage";
import TripsPage from "./pages/TripsPage";
import TrucksPage from "./pages/TrucksPage";
import { ApiError, api } from "./lib/api";
import type { User } from "./types";

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [checkingSession, setCheckingSession] = useState(window.location.pathname !== "/");
  const [connectionError, setConnectionError] = useState("");

  const navigate = useCallback((path: "/" | "/login" | "/register" | "/app") => {
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
    setPathname(path);
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === "/") {
      setCheckingSession(false);
      setConnectionError("");
      setUser(null);
      return;
    }

    if (!["/login", "/register", "/app"].includes(pathname)) {
      navigate("/");
      return;
    }

    let active = true;
    setCheckingSession(true);
    api<{ user: User }>("/auth/me").then(({ user: currentUser }) => {
      if (!active) return;
      setUser(currentUser);
      setConnectionError("");
      if (pathname !== "/app") navigate("/app");
    }).catch((error: unknown) => {
      if (!active) return;
      setUser(null);
      if (error instanceof ApiError && error.status === 401) {
        setConnectionError("");
        if (pathname === "/app") navigate("/login");
      } else {
        setConnectionError(error instanceof Error ? error.message : "Serverga ulanib bo'lmadi.");
      }
    }).finally(() => {
      if (active) setCheckingSession(false);
    });
    return () => { active = false; };
  }, [navigate, pathname]);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Server bilan bog'lanib bo'lmadi.");
    } finally {
      setUser(null);
      setSection("overview");
      navigate("/login");
    }
  }

  if (pathname === "/") {
    return <LandingPage onNavigate={navigate} />;
  }

  if (checkingSession) {
    return <main className="boot-screen"><span className="boot-mark">Y</span><span>YUKBOR ish maydoni ochilmoqda...</span></main>;
  }

  if (!user || pathname !== "/app") {
    return (
      <>
        {connectionError && <div role="alert" className="connection-banner">{connectionError} API server ishga tushganini tekshiring.</div>}
        <AuthScreen
          initialMode={pathname === "/register" ? "register" : "login"}
          onModeChange={(mode) => navigate(mode === "register" ? "/register" : "/login")}
          onAuthenticated={(authenticatedUser) => {
            setUser(authenticatedUser);
            setConnectionError("");
            navigate("/app");
          }}
        />
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
