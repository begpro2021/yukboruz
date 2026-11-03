import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownUp, CalendarDays, MapPin, Package, Search, Send, Weight } from "lucide-react";
import { api, jsonBody } from "../lib/api";
import { formatUzs, relativeDate } from "../lib/format";
import type { Cargo, Truck, User } from "../types";

type Props = { user: User };

const bodyTypes = ["Tent", "Ref", "Izoterm", "Furgon", "Ochiq", "Konteyner", "Samosval"];
const canPost = (role: User["role"]) => ["SHIPPER", "FLEET", "DISPATCHER"].includes(role);
const canBid = (role: User["role"]) => ["DRIVER", "FLEET", "DISPATCHER"].includes(role);

export default function CargosPage({ user }: Props) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
    Promise.all([
      api<{ cargos: Cargo[] }>(`/cargos${query}`),
      canBid(user.role) ? api<{ trucks: Truck[] }>("/trucks?available=true") : Promise.resolve({ trucks: [] }),
    ]).then(([cargoResult, truckResult]) => {
      if (!active) return;
      setCargos(cargoResult.cargos);
      setTrucks(truckResult.trucks.filter((truck) => truck.ownerId === user.id));
      setError("");
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Yuklarni yuklab bo'lmadi.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [search, reloadKey, user.id, user.role]);

  async function createCargo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const loadingAtValue = String(values.get("loadingAt") || "");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/cargos", {
        method: "POST",
        body: jsonBody({
          origin: values.get("origin"),
          destination: values.get("destination"),
          cargoName: values.get("cargoName"),
          bodyType: values.get("bodyType"),
          weightTons: Number(values.get("weightTons")),
          volumeM3: Number(values.get("volumeM3")),
          priceUzs: Number(values.get("priceUzs")),
          dealMode: values.get("dealMode"),
          ...(loadingAtValue ? { loadingAt: new Date(loadingAtValue).toISOString() } : {}),
        }),
      });
      form.reset();
      setNotice("Yuk e'loni birjaga joylandi.");
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "E'lonni yaratib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function submitBid(event: FormEvent<HTMLFormElement>, cargo: Cargo) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/cargos/${cargo.id}/bids`, {
        method: "POST",
        body: jsonBody({
          amountUzs: Number(values.get("amountUzs")),
          note: values.get("note") || undefined,
          truckId: values.get("truckId") || undefined,
        }),
      });
      setNotice(`${cargo.publicId} e'loniga taklif yuborildi.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Taklif yuborilmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function acceptBid(cargo: Cargo, bidId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/cargos/${cargo.id}/bids/${bidId}/accept`, { method: "POST" });
      setNotice(`${cargo.publicId} uchun tashuvchi tanlandi. Reys yaratildi.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Taklifni qabul qilib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelCargo(cargo: Cargo) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/cargos/${cargo.id}`, {
        method: "PATCH",
        body: jsonBody({ status: "CANCELLED" }),
      });
      setNotice(`${cargo.publicId} e'loni bekor qilindi.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "E'lonni bekor qilib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div><p className="eyebrow">YUKBOR BOZORI</p><h1>Yuklar birjasi</h1><p>O‘zbekiston bo‘ylab ochiq yuklar va tashuvchilar.</p></div>
        <div className="market-count"><span>{cargos.length}</span> e'lon</div>
      </div>

      {error && <div role="alert" className="inline-alert alert-error">{error}</div>}
      {notice && <div role="status" className="inline-alert alert-success">{notice}</div>}

      {canPost(user.role) && (
        <details className="create-panel">
          <summary><span><Package size={18} /> Yuk e'loni joylash</span><span className="summary-hint">Bozor uchun yangi yuk qo‘shish</span></summary>
          <form className="cargo-form form-grid" onSubmit={createCargo}>
            <label className="field"><span>Qayerdan</span><input name="origin" required minLength={2} maxLength={120} placeholder="Toshkent" /></label>
            <label className="field"><span>Qayerga</span><input name="destination" required minLength={2} maxLength={120} placeholder="Samarqand" /></label>
            <label className="field"><span>Yuk nomi</span><input name="cargoName" required minLength={2} maxLength={160} placeholder="Maishiy texnika" /></label>
            <label className="field"><span>Kuzov turi</span><select name="bodyType" required defaultValue=""><option value="" disabled>Tanlang</option>{bodyTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="field"><span>Og‘irlik, tonna</span><input name="weightTons" type="number" step="0.1" min="0.1" max="100" required placeholder="20" /></label>
            <label className="field"><span>Hajm, m³</span><input name="volumeM3" type="number" step="0.1" min="0.1" max="200" required placeholder="86" /></label>
            <label className="field"><span>Narx, so‘m</span><input name="priceUzs" type="number" min="1" max="2000000000" required placeholder="8500000" /></label>
            <label className="field"><span>Kelishuv</span><select name="dealMode" defaultValue="AUCTION"><option value="AUCTION">Takliflar qabul qilinadi</option><option value="FIXED">Qat'iy narx</option></select></label>
            <label className="field"><span>Yuklash vaqti</span><input name="loadingAt" type="datetime-local" /></label>
            <div className="form-actions"><button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saqlanmoqda..." : "E'lonni joylash"} <ArrowDownUp size={15} /></button></div>
          </form>
        </details>
      )}

      <div className="search-bar">
        <Search size={18} />
        <input aria-label="Yuk e'lonlarini qidirish" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Yo‘nalish, yuk yoki kuzov bo‘yicha qidiring..." />
        <span>QIDIRUV</span>
      </div>

      {loading ? <div className="loading-panel">Yuklar yuklanmoqda...</div> : (
        <div className="cargo-list">
          {cargos.map((cargo) => {
            const isOwner = cargo.ownerId === user.id;
            const pendingBids = cargo.bids.filter((bid) => bid.status === "PENDING");
            return (
              <article className="cargo-card" key={cargo.id}>
                <div className="cargo-card-main">
                  <div className="cargo-card-header">
                    <span className="cargo-id">{cargo.publicId}</span>
                    <span className={`status-tag ${cargo.status === "OPEN" ? "status-open" : cargo.status === "ASSIGNED" ? "status-assigned" : "status-neutral"}`}>
                      {cargo.status === "OPEN" ? "Ochiq" : cargo.status === "ASSIGNED" ? "Tashuvchi topildi" : cargo.status === "COMPLETED" ? "Yakunlangan" : "Bekor qilingan"}
                    </span>
                    <span className="cargo-owner">{cargo.owner.name}</span>
                  </div>
                  <h2 className="route-heading"><MapPin size={19} /><span>{cargo.origin}</span><span className="route-arrow">→</span><span>{cargo.destination}</span></h2>
                  <div className="cargo-meta">
                    <span><Package size={15} />{cargo.cargoName}</span>
                    <span><Weight size={15} />{cargo.weightTons} t · {cargo.volumeM3} m³</span>
                    <span>{cargo.bodyType}</span>
                    <span><CalendarDays size={15} />{relativeDate(cargo.loadingAt)}</span>
                  </div>
                  {cargo.bids.length > 0 && (
                    <div className="bid-list">
                      <div className="bid-list-title">{cargo.bids.length} ta taklif <span>{pendingBids.length} faol</span></div>
                      {cargo.bids.map((bid) => (
                        <div className="bid-row" key={bid.id}>
                          <div className="bid-driver"><span className="mini-avatar">{bid.driver.name.trim().charAt(0).toUpperCase()}</span><div><strong>{bid.driver.name}</strong><small>{bid.truck ? `${bid.truck.vehicle} · ${bid.truck.plate}` : "Transport ma'lumoti berilmagan"}</small></div></div>
                          <strong className="bid-price">{formatUzs(bid.amountUzs)}</strong>
                          {isOwner && bid.status === "PENDING" && cargo.status === "OPEN" && (
                            <button type="button" className="button button-dark button-small" disabled={busy} onClick={() => acceptBid(cargo, bid.id)}>Tanlash</button>
                          )}
                          {bid.status !== "PENDING" && <span className={`bid-status bid-${bid.status.toLowerCase()}`}>{bid.status === "ACCEPTED" ? "Qabul qilindi" : "Yakunlandi"}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {isOwner && cargo.status === "OPEN" && (
                    <button type="button" className="text-button cancel-link" disabled={busy} onClick={() => cancelCargo(cargo)}>E'lonni bekor qilish</button>
                  )}
                  {canBid(user.role) && !isOwner && cargo.status === "OPEN" && (
                    <details className="bid-compose">
                      <summary><Send size={14} /> Taklif yuborish</summary>
                      <form className="bid-form" onSubmit={(event) => submitBid(event, cargo)}>
                        <label className="field"><span>Narx, so‘m</span><input name="amountUzs" type="number" min="1" max="2000000000" required defaultValue={cargo.dealMode === "FIXED" ? cargo.priceUzs : ""} readOnly={cargo.dealMode === "FIXED"} /></label>
                        {trucks.length > 0 && <label className="field"><span>Transport (ixtiyoriy)</span><select name="truckId" defaultValue=""><option value="">Tanlanmagan</option>{trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.vehicle} · {truck.plate}</option>)}</select></label>}
                        <label className="field bid-note"><span>Izoh (ixtiyoriy)</span><input name="note" maxLength={500} placeholder="Qo‘shimcha ma'lumot" /></label>
                        <button type="submit" className="button button-primary button-small" disabled={busy}>Taklifni yuborish</button>
                      </form>
                    </details>
                  )}
                </div>
                <aside className="cargo-price">
                  <span>{cargo.dealMode === "FIXED" ? "Qat'iy narx" : "Boshlang‘ich narx"}</span>
                  <strong>{formatUzs(cargo.priceUzs)}</strong>
                  <small>{cargo.bids.length} taklif</small>
                </aside>
              </article>
            );
          })}
          {cargos.length === 0 && <div className="empty-panel"><Package size={23} /><strong>Hozircha yuk e'loni yo‘q</strong><span>Qidiruvni o‘zgartiring yoki keyinroq qayta tekshiring.</span></div>}
        </div>
      )}
    </div>
  );
}
