import { ArrowDown, ArrowRight, Boxes, ClipboardCheck, Truck } from "lucide-react";

type Props = {
  onNavigate: (path: "/login" | "/register") => void;
};

const journey = [
  {
    title: "Yuk e'lon qilinadi",
    detail: "Yo‘nalish, yuk va kerakli transport turini kiriting.",
    label: "YUK EGASI",
  },
  {
    title: "Takliflar keladi",
    detail: "Tashuvchilar e'lonni topib, narx taklifini yuboradi.",
    label: "TASHUVCHI",
  },
  {
    title: "Taklif tanlanadi",
    detail: "Yuk egasi takliflarni ko‘rib, mos tashuvchini tanlaydi.",
    label: "KELISHUV",
  },
  {
    title: "Reys boshqariladi",
    detail: "Kelishilgan reysning holati ish maydonida yuritiladi.",
    label: "REYS",
  },
];

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="brand-lockup landing-brand" href="/" aria-label="YUKBOR bosh sahifasi">
          <span className="brand-mark"><Truck size={21} strokeWidth={2.2} /></span>
          <span>YUKBOR<span className="brand-dot">.</span></span>
        </a>
        <nav className="landing-nav" aria-label="Sahifa bo‘limlari">
          <a href="#jarayon">Qanday ishlaydi</a>
          <a href="#kimlar-uchun">Kimlar uchun</a>
        </nav>
        <div className="landing-actions">
          <button type="button" className="landing-login" onClick={() => onNavigate("/login")}>Kirish</button>
          <button type="button" className="button button-primary landing-join" onClick={() => onNavigate("/register")}>
            Profil yaratish <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <h1>Yuk bor.<br /><span>Yo‘lini toping.</span></h1>
            <p className="hero-description">
              YUKBOR yuk egasi va tashuvchini bitta ish jarayonida bog‘laydi:
              yukni e'lon qiling, takliflarni solishtiring, reysni boshqaring.
            </p>
            <div className="hero-actions">
              <button type="button" className="button button-primary hero-primary" onClick={() => onNavigate("/register")}>
                Bozorga qo‘shilish <ArrowRight size={17} />
              </button>
              <a className="hero-secondary" href="#jarayon">Jarayonni ko‘rish <ArrowDown size={15} /></a>
            </div>
            <p className="hero-role-note">O‘zbekiston bo‘ylab · Yuk egalari · Haydovchilar · Avtoparklar</p>
          </div>

          <div className="journey-board" aria-labelledby="journey-board-title">
            <div className="journey-board-head">
              <div>
                <span className="board-live"><span /> ISH JARAYONI</span>
                <h2 id="journey-board-title">E'londan reysgacha</h2>
              </div>
              <span className="board-mark" aria-hidden="true"><Boxes size={20} /></span>
            </div>

            <div className="sample-route">
              <span className="sample-label">NAMUNAVIY YO‘NALISH</span>
              <div className="sample-route-cities">
                <strong>Toshkent</strong><span className="sample-line" aria-hidden="true" /><strong>Samarqand</strong>
              </div>
              <span className="sample-cargo">Yuk e'loni · Tent</span>
            </div>

            <div className="journey-route" aria-hidden="true">
              <span className="route-station" /><span className="route-station" /><span className="route-station" /><span className="route-station" />
              <span className="route-traveler"><Truck size={16} /></span>
            </div>

            <ol className="journey-steps" aria-label="YUKBOR'dagi ish jarayoni">
              {journey.map((step, index) => (
                <li className="journey-step" key={step.label}>
                  <span className="journey-step-index">0{index + 1}</span>
                  <span className="journey-step-label">{step.label}</span>
                  <strong>{step.title}</strong>
                </li>
              ))}
            </ol>
            <p className="sample-disclaimer">Ko‘rgazmali namuna — real e'lon yoki reys emas.</p>
          </div>
        </section>

        <section className="process-section" id="jarayon">
          <div className="process-heading">
            <h2>Yukdan reysgacha — bitta tushunarli oqim.</h2>
            <p>Har bir qadam yuk egasi va tashuvchiga keyingi ishni ko‘rsatadi.</p>
          </div>
          <ol className="process-list">
            {journey.map((step, index) => (
              <li className="process-step" key={step.label}>
                <span className="process-index">0{index + 1}</span>
                <div><span className="process-role">{step.label}</span><h3>{step.title}</h3></div>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="audience-section" id="kimlar-uchun">
          <div className="audience-heading">
            <h2>Ikki tomon. Umumiy ish maydoni.</h2>
            <p>YUKBOR kundalik tashish kelishuvini bir joyda tartibga solishga yordam beradi.</p>
          </div>
          <div className="audience-columns">
            <article className="audience-column">
              <span className="audience-symbol"><Boxes size={19} /></span>
              <h3>Yuk egalari uchun</h3>
              <p>Yukni e'lon qiling, kelgan takliflarni ko‘ring va tanlovdan so‘ng reys holatini boshqaring.</p>
              <button type="button" className="audience-link" onClick={() => onNavigate("/register")}>Yuk egasi sifatida boshlash <ArrowRight size={15} /></button>
            </article>
            <article className="audience-column">
              <span className="audience-symbol"><Truck size={19} /></span>
              <h3>Tashuvchilar uchun</h3>
              <p>Yuklarni yo‘nalish va transport turiga qarab izlang, mos e'lonlarga narx taklif qiling.</p>
              <button type="button" className="audience-link" onClick={() => onNavigate("/register")}>Tashuvchi sifatida boshlash <ArrowRight size={15} /></button>
            </article>
          </div>
        </section>

        <section className="landing-close">
          <div>
            <span className="close-symbol"><ClipboardCheck size={19} /></span>
            <h2>Keyingi yukingiz uchun ishni boshlang.</h2>
            <p>YUKBOR’da profil yarating va yuklar hamda transportlar bozorini ko‘ring.</p>
          </div>
          <button type="button" className="button button-primary" onClick={() => onNavigate("/register")}>
            Profil yaratish <ArrowRight size={16} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="footer-brand" href="/">YUKBOR<span>.</span></a>
        <span>Yuk va tashuvchilar uchun ish maydoni.</span>
        <button type="button" onClick={() => onNavigate("/login")}>Hisobingiz bormi? Kirish</button>
      </footer>
    </div>
  );
}
