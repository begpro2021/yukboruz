import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Truck } from "lucide-react";
import { api, jsonBody } from "../lib/api";
import type { User, UserRole } from "../types";

type Props = {
  onAuthenticated: (user: User) => void;
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "SHIPPER", label: "Yuk egasi" },
  { value: "DRIVER", label: "Haydovchi" },
  { value: "FLEET", label: "Avtopark" },
  { value: "DISPATCHER", label: "Dispetcher" },
];
const registrationRoles = roleOptions.filter((option) => option.value !== "DISPATCHER");

const demoPhones: Record<UserRole, string> = {
  SHIPPER: "+998900000001",
  DRIVER: "+998900000002",
  FLEET: "+998900000003",
  DISPATCHER: "+998900000004",
};

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(import.meta.env.DEV ? demoPhones.SHIPPER : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "Demo1234!" : "");
  const [role, setRole] = useState<UserRole>("SHIPPER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { phone, password }
        : { name, phone, password, role };
      const result = await api<{ user: User }>(path, {
        method: "POST",
        body: jsonBody(body),
      });
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Kirish amalga oshmadi.");
    } finally {
      setBusy(false);
    }
  }

  function chooseDemo(selectedRole: UserRole) {
    setMode("login");
    setRole(selectedRole);
    setPhone(demoPhones[selectedRole]);
    setPassword("Demo1234!");
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand-lockup" href="/" aria-label="YUKBOR bosh sahifasi">
          <span className="brand-mark"><Truck size={23} strokeWidth={2.2} /></span>
          <span>YUKBOR<span className="brand-dot">.</span></span>
        </a>
        <div className="auth-story-copy">
          <span className="auth-kicker"><span className="live-dot" /> Logistika bozori</span>
          <h1>Yuk bor.<br /><span>Yo‘l bor.</span></h1>
          <p>Yuk e'lonlarini ko‘ring, mos transport toping va reysni bir joydan boshqaring.</p>
        </div>
        <div className="auth-route" aria-label="Toshkentdan Andijonga yo'nalish">
          <div className="route-point"><span className="route-dot route-dot-start" /><span>Toshkent</span></div>
          <span className="route-dash" />
          <div className="route-point"><span className="route-dot route-dot-end" /><span>Andijon</span></div>
          <span className="route-tag">A373</span>
        </div>
        <p className="auth-footnote">O‘zbekiston bo‘ylab yuk va tashuvchilar uchun yagona ish maydoni.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-lock"><LockKeyhole size={18} /></div>
            <div>
              <p className="eyebrow">{mode === "login" ? "ISH MAYDONIGA KIRISH" : "YANGI PROFIL"}</p>
              <h2>{mode === "login" ? "Xush kelibsiz" : "Hisob yarating"}</h2>
            </div>
          </div>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Davom etish uchun telefon raqamingiz va parolingizni kiriting."
              : "Rolingizni tanlang va YUKBOR'dan foydalanishni boshlang."}
          </p>

          <form onSubmit={submit} className="form-stack">
            {mode === "register" && (
              <label className="field">
                <span>Ism yoki kompaniya nomi</span>
                <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required autoComplete="name" placeholder="Masalan, Oltin Vodiy Logistika" />
              </label>
            )}
            <label className="field">
              <span>Telefon raqami</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" inputMode="tel" placeholder="+998 90 123 45 67" />
            </label>
            <label className="field">
              <span>Parol</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Kamida 8 belgi" />
            </label>
            {mode === "register" && (
              <label className="field">
                <span>Profil turi</span>
                <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                  {registrationRoles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            )}

            {error && <div role="alert" className="inline-alert alert-error">{error}</div>}
            <button type="submit" className="button button-primary auth-submit" disabled={busy}>
              {busy ? "Kutilmoqda..." : mode === "login" ? "Kabinetga kirish" : "Profil yaratish"}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-switch">
            <span>{mode === "login" ? "Yangi foydalanuvchimisiz?" : "Profilingiz bormi?"}</span>
            <button type="button" className="text-button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Ro‘yxatdan o‘tish" : "Kirish"}
            </button>
          </div>

          {import.meta.env.DEV && mode === "login" && (
            <details className="demo-access">
              <summary>Mahalliy demo profillar</summary>
              <p>Faqat seed qilingan lokal ma'lumotlar uchun. Parol: <code>Demo1234!</code></p>
              <div className="demo-role-list">
                {roleOptions.map((option) => (
                  <button type="button" key={option.value} onClick={() => chooseDemo(option.value)}>
                    <span>{option.label}</span><span>{demoPhones[option.value]}</span>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
        <p className="auth-legal">Davom etish orqali foydalanish shartlariga rozilik bildirasiz.</p>
      </section>
    </main>
  );
}
