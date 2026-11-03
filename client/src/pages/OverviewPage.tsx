import { useEffect, useState } from "react";
import { ArrowRight, Boxes, CircleDollarSign, MapPinned, Truck } from "lucide-react";
import { api } from "../lib/api";
import { formatUzs } from "../lib/format";
import type { Cargo, Trip, Truck as TruckType, User } from "../types";
import type { Section } from "../components/Workspace";

type Props = { user: User; onNavigate: (section: Section) => void };

export default function OverviewPage({ user, onNavigate }: Props) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ cargos: Cargo[] }>("/cargos"),
      api<{ trucks: TruckType[] }>("/trucks"),
      api<{ trips: Trip[] }>("/trips"),
    ]).then(([cargoResult, truckResult, tripResult]) => {
      if (!active) return;
      setCargos(cargoResult.cargos);
      setTrucks(truckResult.trucks);
      setTrips(tripResult.trips);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Ma'lumotlarni yuklab bo'lmadi.");
    });
    return () => { active = false; };
  }, []);

  const activeTrips = trips.filter((trip) => !["DELIVERED", "CANCELLED"].includes(trip.status));
  const openCargos = cargos.filter((cargo) => cargo.status === "OPEN");
  const availableTrucks = trucks.filter((truck) => truck.available);

  return (
    <div className="page-stack">
      <section className="welcome-strip">
        <div>
          <p className="eyebrow">YUKBOR ISH MAYDONI</p>
          <h1>Assalomu alaykum, {user.name.split(" ")[0]}.</h1>
          <p>Bugungi yuklar, transportlar va reyslaringiz bir joyda.</p>
        </div>
        <button type="button" className="button button-dark" onClick={() => onNavigate("cargos")}>
          Birjani ochish <ArrowRight size={16} />
        </button>
        <div className="welcome-route" aria-hidden="true">
          <span /><i /><i /><i /><span />
        </div>
      </section>

      {error && <div role="alert" className="inline-alert alert-error">{error}</div>}

      <section className="stat-grid" aria-label="Bozor ko'rsatkichlari">
        <article className="stat-card">
          <div className="stat-top"><span>Ochiq yuk e'lonlari</span><Boxes size={18} /></div>
          <strong>{openCargos.length}</strong><small>Birjada ko‘rsatilgan yuklar</small>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Mavjud transportlar</span><Truck size={18} /></div>
          <strong>{availableTrucks.length}</strong><small>Yuk qidirayotgan transportlar</small>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Faol reyslar</span><MapPinned size={18} /></div>
          <strong>{activeTrips.length}</strong><small>Topshirilishi kutilayotgan yuklar</small>
        </article>
        <article className="stat-card stat-card-accent">
          <div className="stat-top"><span>Ochiq yuklar qiymati</span><CircleDollarSign size={18} /></div>
          <strong className="stat-amount">{formatUzs(openCargos.reduce((total, cargo) => total + cargo.priceUzs, 0))}</strong>
          <small>Namoyishdagi e'lonlar summasi</small>
        </article>
      </section>

      <section className="section-heading">
        <div><h2>Yuklar birjasi</h2><p>Yangi e'lonlarni ko'rib chiqing va taklif yuboring.</p></div>
        <button type="button" className="text-button" onClick={() => onNavigate("cargos")}>Barchasi <ArrowRight size={15} /></button>
      </section>
      <section className="overview-cargo-grid">
        {openCargos.slice(0, 3).map((cargo) => (
          <article className="overview-cargo" key={cargo.id}>
            <div className="overview-cargo-top"><span className="cargo-id">{cargo.publicId}</span><span className="status-tag status-open">Ochiq</span></div>
            <h3>{cargo.origin}<span> → </span>{cargo.destination}</h3>
            <p>{cargo.cargoName} · {cargo.weightTons} t · {cargo.bodyType}</p>
            <div className="overview-cargo-bottom"><strong>{formatUzs(cargo.priceUzs)}</strong><span>{cargo.bids.length} taklif</span></div>
          </article>
        ))}
        {openCargos.length === 0 && <div className="empty-panel">Hozircha ochiq yuk yo‘q.</div>}
      </section>
    </div>
  );
}
