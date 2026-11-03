import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, MapPin, Truck as TruckIcon } from "lucide-react";
import { api, jsonBody } from "../lib/api";
import type { Truck, User } from "../types";

type Props = { user: User };
const canCreate = (role: User["role"]) => role === "DRIVER" || role === "FLEET";

export default function TrucksPage({ user }: Props) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ trucks: Truck[] }>("/trucks").then(({ trucks: result }) => {
      if (active) setTrucks(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Transportlarni yuklab bo'lmadi.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]);

  async function createTruck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/trucks", {
        method: "POST",
        body: jsonBody({
          vehicle: values.get("vehicle"),
          plate: values.get("plate"),
          bodyType: values.get("bodyType"),
          capacityTons: Number(values.get("capacityTons")),
          volumeM3: Number(values.get("volumeM3")),
          currentCity: values.get("currentCity"),
          targetRoute: values.get("targetRoute"),
        }),
      });
      form.reset();
      setNotice("Transport e'loni birjaga qo‘shildi.");
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Transportni saqlab bo'lmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(truck: Truck) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/trucks/${truck.id}`, {
        method: "PATCH",
        body: jsonBody({ available: !truck.available }),
      });
      setNotice(`${truck.publicId} holati yangilandi.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Transport holati yangilanmadi.");
    } finally {
      setBusy(false);
    }
  }

  const availableCount = trucks.filter((truck) => truck.available).length;
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div><p className="eyebrow">TASHUVCHILAR</p><h1>Transportlar</h1><p>Bo‘sh transportlarni toping yoki o‘zingiznikini e'lon qiling.</p></div>
        <div className="market-count"><span>{availableCount}</span> bo‘sh transport</div>
      </div>

      {error && <div role="alert" className="inline-alert alert-error">{error}</div>}
      {notice && <div role="status" className="inline-alert alert-success">{notice}</div>}

      {canCreate(user.role) && (
        <details className="create-panel">
          <summary><span><TruckIcon size={18} /> Transport qo‘shish</span><span className="summary-hint">Yuklar uchun bo‘sh transport e'lon qiling</span></summary>
          <form className="cargo-form form-grid" onSubmit={createTruck}>
            <label className="field"><span>Markasi va modeli</span><input name="vehicle" minLength={2} maxLength={100} required placeholder="DAF XF 480" /></label>
            <label className="field"><span>Davlat raqami</span><input name="plate" minLength={3} maxLength={20} required placeholder="01 A 123 AA" /></label>
            <label className="field"><span>Kuzov turi</span><input name="bodyType" minLength={2} maxLength={60} required placeholder="Tent" /></label>
            <label className="field"><span>Yuk ko‘tarishi, tonna</span><input name="capacityTons" type="number" step="0.1" min="0.1" max="100" required placeholder="20" /></label>
            <label className="field"><span>Hajmi, m³</span><input name="volumeM3" type="number" step="0.1" min="0.1" max="200" required placeholder="86" /></label>
            <label className="field"><span>Hozirgi shahar</span><input name="currentCity" minLength={2} maxLength={120} required placeholder="Toshkent" /></label>
            <label className="field"><span>Rejalashtirilgan yo‘nalish</span><input name="targetRoute" minLength={2} maxLength={160} required placeholder="Toshkent — Farg‘ona" /></label>
            <div className="form-actions"><button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saqlanmoqda..." : "Transportni e'lon qilish"} <ArrowRight size={15} /></button></div>
          </form>
        </details>
      )}

      {loading ? <div className="loading-panel">Transportlar yuklanmoqda...</div> : (
        <div className="truck-grid">
          {trucks.map((truck) => (
            <article className="truck-card" key={truck.id}>
              <div className="truck-card-head">
                <span className={`status-tag ${truck.available ? "status-open" : "status-neutral"}`}>{truck.available ? "Bo‘sh" : "Band"}</span>
                <span className="cargo-id">{truck.publicId}</span>
              </div>
              <div className="truck-illustration"><TruckIcon size={32} strokeWidth={1.4} /><span>{truck.bodyType}</span></div>
              <h2>{truck.vehicle}</h2>
              <p className="truck-plate">{truck.plate} <span>·</span> {truck.owner.name}</p>
              <div className="truck-specs"><span>{truck.capacityTons} t yuk</span><span>{truck.volumeM3} m³</span></div>
              <div className="truck-route"><MapPin size={16} /><span><strong>{truck.currentCity}</strong><small>{truck.targetRoute}</small></span></div>
              {truck.ownerId === user.id && (
                <button type="button" className={`button ${truck.available ? "button-outline" : "button-dark"} truck-toggle`} disabled={busy} onClick={() => toggleAvailability(truck)}>
                  {truck.available ? "Band qilish" : "Bo‘sh deb belgilash"}
                </button>
              )}
            </article>
          ))}
          {trucks.length === 0 && <div className="empty-panel"><TruckIcon size={23} /><strong>Hozircha transport e'loni yo‘q</strong><span>Transport qo‘shilgach, shu yerda ko‘rinadi.</span></div>}
        </div>
      )}
    </div>
  );
}
