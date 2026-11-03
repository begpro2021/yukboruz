import { useEffect, useState } from "react";
import { ArrowRight, Check, CircleDot, MapPinned, Truck as TruckIcon } from "lucide-react";
import { api, jsonBody } from "../lib/api";
import { formatUzs, relativeDate } from "../lib/format";
import type { Trip, TripStatus } from "../types";

const nextStatuses: Partial<Record<TripStatus, TripStatus>> = {
  ASSIGNED: "LOADING",
  LOADING: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};
const statusNames: Record<TripStatus, string> = {
  ASSIGNED: "Tashuvchi tayinlandi",
  LOADING: "Yuklanmoqda",
  IN_TRANSIT: "Yo‘lda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};
const nextLabels: Partial<Record<TripStatus, string>> = {
  ASSIGNED: "Yuklashni boshlash",
  LOADING: "Yo‘lga chiqish",
  IN_TRANSIT: "Yukni topshirish",
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ trips: Trip[] }>("/trips").then(({ trips: result }) => {
      if (active) setTrips(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Reyslarni yuklab bo'lmadi.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]);

  async function updateTrip(trip: Trip, status: TripStatus) {
    setBusyId(trip.id);
    setError("");
    setNotice("");
    try {
      await api(`/trips/${trip.id}/status`, {
        method: "PATCH",
        body: jsonBody({ status }),
      });
      setNotice(`${trip.cargo.publicId}: ${statusNames[status].toLowerCase()}.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Reys holatini yangilab bo'lmadi.");
    } finally {
      setBusyId("");
    }
  }

  const activeTrips = trips.filter((trip) => !["DELIVERED", "CANCELLED"].includes(trip.status));
  const finishedTrips = trips.filter((trip) => ["DELIVERED", "CANCELLED"].includes(trip.status));

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div><p className="eyebrow">TASHISH JARAYONI</p><h1>Mening reyslarim</h1><p>Kelishilgan yuklar va yetkazib berish holati.</p></div>
        <div className="market-count"><span>{activeTrips.length}</span> faol reys</div>
      </div>
      {error && <div role="alert" className="inline-alert alert-error">{error}</div>}
      {notice && <div role="status" className="inline-alert alert-success">{notice}</div>}

      {loading ? <div className="loading-panel">Reyslar yuklanmoqda...</div> : (
        <>
          <section className="trips-section">
            <div className="section-heading"><div><h2>Faol reyslar</h2><p>Har bosqichda holatni yangilab boring.</p></div></div>
            {activeTrips.length > 0 ? <div className="trip-list">{activeTrips.map((trip) => {
              const next = nextStatuses[trip.status];
              return (
                <article className="trip-card" key={trip.id}>
                  <div className="trip-card-head"><span className="cargo-id">{trip.cargo.publicId}</span><span className="status-tag status-assigned"><CircleDot size={13} />{statusNames[trip.status]}</span><span className="trip-date">{relativeDate(trip.cargo.loadingAt)}</span></div>
                  <div className="trip-route"><div><span className="route-dot route-dot-start" /><div><small>YUKLASH</small><strong>{trip.cargo.origin}</strong></div></div><i /><div><span className="route-dot route-dot-end" /><div><small>MANZIL</small><strong>{trip.cargo.destination}</strong></div></div></div>
                  <div className="trip-info">
                    <span><TruckIcon size={15} />{trip.truck ? `${trip.truck.vehicle} · ${trip.truck.plate}` : trip.carrier.name}</span>
                    <span>{trip.cargo.cargoName} · {trip.cargo.weightTons} t</span>
                    <strong>{formatUzs(trip.bid.amountUzs)}</strong>
                  </div>
                  <div className="trip-progress" aria-label={`Reys ${trip.progressPct}% bajarildi`}><span style={{ transform: `scaleX(${trip.progressPct / 100})` }} /></div>
                  <div className="trip-card-footer">
                    <span>Yuk egasi: {trip.shipper.name}</span>
                    {next && <button type="button" className="button button-dark button-small" disabled={busyId === trip.id} onClick={() => updateTrip(trip, next)}>
                      {busyId === trip.id ? "Saqlanmoqda..." : nextLabels[trip.status]} <ArrowRight size={14} />
                    </button>}
                    {trip.status === "ASSIGNED" && <button type="button" className="text-button cancel-link" disabled={busyId === trip.id} onClick={() => updateTrip(trip, "CANCELLED")}>Bekor qilish</button>}
                    {trip.status === "LOADING" && <button type="button" className="text-button cancel-link" disabled={busyId === trip.id} onClick={() => updateTrip(trip, "CANCELLED")}>Bekor qilish</button>}
                  </div>
                </article>
              );
            })}</div> : <div className="empty-panel"><MapPinned size={23} /><strong>Faol reys topilmadi</strong><span>Taklif qabul qilingach, reys shu yerda paydo bo‘ladi.</span></div>}
          </section>

          {finishedTrips.length > 0 && (
            <section className="trips-section">
              <div className="section-heading"><div><h2>Yakunlangan reyslar</h2><p>Oldingi tashishlar tarixi.</p></div></div>
              <div className="finished-list">{finishedTrips.map((trip) => (
                <div className="finished-trip" key={trip.id}>
                  <span className={`status-tag ${trip.status === "DELIVERED" ? "status-open" : "status-neutral"}`}>{trip.status === "DELIVERED" && <Check size={13} />}{statusNames[trip.status]}</span>
                  <strong>{trip.cargo.origin} <ArrowRight size={14} /> {trip.cargo.destination}</strong>
                  <span>{trip.cargo.publicId}</span><b>{formatUzs(trip.bid.amountUzs)}</b>
                </div>
              ))}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
