import { Link } from "@tanstack/react-router";
import { useState } from "react";

const nav = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/servicos", label: "Serviços" },
  { to: "/cases", label: "Cases" },
  { to: "/blog", label: "Insights" },
  { to: "/carreiras", label: "Carreiras" },
  { to: "/contato", label: "Contato" },
] as const;

export function Newsletter() {
  const [ok, setOk] = useState(false);
  return (
    <section className="bg-secondary py-20">
      <div className="container-site grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="eyebrow">Newsletter</p>
          <h2 className="mt-3 text-4xl">Insights no seu e-mail, uma vez por mês.</h2>
        </div>
        {ok ? <p className="font-display text-2xl">Inscrição confirmada. Obrigado!</p> : (
          <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); setOk(true); }}>
            <input required type="email" placeholder="seu@email.com" className="flex-1 rounded-full border bg-card px-5 py-3 outline-none focus:border-accent" />
            <button className="btn-primary">Assinar</button>
          </form>
        )}
      </div>
    </section>
  );
}

export function WhatsAppButton() {
  return (
    <a href="https://wa.me/551140000000" target="_blank" rel="noreferrer" aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground shadow-lg transition hover:scale-110">
      💬
    </a>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
      <div className="hidden bg-primary text-xs text-primary-foreground md:block">
        <div className="container-site flex justify-between py-2 opacity-90">
          <span>📞 (11) 4000-0000 · ✉ contato@vertice.com.br</span>
          <span>Seg a sex, 9h às 18h · LinkedIn · Instagram</span>
        </div>
      </div>
      <div className="container-site flex h-18 items-center justify-between py-4">
        <Link to="/" className="font-display text-2xl font-semibold text-primary">
          Vértice<span className="text-accent">.</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/contato" className="btn-primary hidden !py-2.5 text-sm md:inline-flex">Fale conosco</Link>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <nav className="container-site flex flex-col gap-3 pb-4 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-1 font-medium">{n.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-site grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl">Vértice<span className="text-accent">.</span></p>
          <p className="mt-4 max-w-sm opacity-75">Consultoria estratégica para empresas que querem crescer com solidez, propósito e resultados mensuráveis.</p>
        </div>
        <div>
          <p className="eyebrow mb-4">Navegação</p>
          <ul className="space-y-2 opacity-80">
            {nav.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Contato</p>
          <ul className="space-y-2 opacity-80">
            <li>contato@vertice.com.br</li>
            <li>(11) 4000-0000</li>
            <li>Av. Paulista, 1000 — São Paulo/SP</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container-site py-6 text-sm opacity-60">© {new Date().getFullYear()} Vértice Consultoria. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="border-b bg-secondary">
      <div className="container-site py-20 md:py-28">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-medium md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{text}</p>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="container-site py-20">
      <div className="rounded-2xl bg-accent px-8 py-14 text-accent-foreground md:px-16 md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl">Pronto para o próximo passo?</h2>
          <p className="mt-3 opacity-90">Agende uma conversa sem compromisso com nossos especialistas.</p>
        </div>
        <Link to="/contato" className="btn-ghost mt-6 md:mt-0">Agendar conversa →</Link>
      </div>
    </section>
  );
}
