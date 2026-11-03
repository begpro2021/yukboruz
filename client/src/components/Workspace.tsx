import {
  ArrowUpRight,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plus,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { User } from "../types";

export type Section = "overview" | "cargos" | "trucks" | "trips";

const links: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Bosh sahifa", icon: LayoutDashboard },
  { id: "cargos", label: "Yuklar birjasi", icon: Boxes },
  { id: "trucks", label: "Transportlar", icon: Truck },
  { id: "trips", label: "Mening reyslarim", icon: ClipboardList },
];

const roleNames: Record<User["role"], string> = {
  SHIPPER: "Yuk egasi",
  DRIVER: "Haydovchi",
  FLEET: "Avtopark",
  DISPATCHER: "Dispetcher",
};

type Props = {
  user: User;
  section: Section;
  onNavigate: (section: Section) => void;
  onLogout: () => void;
  children: ReactNode;
};

export default function Workspace({ user, section, onNavigate, onLogout, children }: Props) {
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand-lockup sidebar-brand" href="/" aria-label="YUKBOR bosh sahifasi">
          <span className="brand-mark"><Truck size={21} strokeWidth={2.2} /></span>
          <span>YUKBOR<span className="brand-dot">.</span></span>
        </a>
        <div className="sidebar-label">ISH MAYDONI</div>
        <nav className="side-nav" aria-label="Asosiy navigatsiya">
          {links.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => onNavigate(id)} className={`nav-link ${section === id ? "is-active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === "cargos" && <ArrowUpRight size={14} className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-mark">?</div>
            <div><strong>YUKBOR MVP</strong><span>Asosiy bozor oqimlari</span></div>
          </div>
          <button type="button" className="nav-link logout-link" onClick={onLogout}>
            <LogOut size={18} strokeWidth={1.8} /><span>Chiqish</span>
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-context">
            <span className="topbar-path">YUKBOR <span>/</span> {links.find((item) => item.id === section)?.label}</span>
            <span className="topbar-status"><span className="live-dot" /> Ish maydoni faol</span>
          </div>
          <div className="topbar-user">
            <span className="role-pill">{roleNames[user.role]}</span>
            <div className="user-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</div>
            <div className="user-details"><strong>{user.name}</strong><span>{user.phone}</span></div>
            {user.role === "SHIPPER" && (
              <button type="button" className="button button-primary button-small topbar-create" onClick={() => onNavigate("cargos")}>
                <Plus size={16} /> Yuk e'loni
              </button>
            )}
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Mobil navigatsiya">
        {links.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} onClick={() => onNavigate(id)} className={section === id ? "is-active" : ""}>
            <Icon size={19} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
