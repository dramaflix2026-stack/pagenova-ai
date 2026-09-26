"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { readPageNovaProject, savePageNovaProject } from "@/lib/pagenova-project-store";

type Service = { id: string; name: string; duration: number; price: number };
type Reservation = {
  id: string;
  serviceId: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
  status: "confirmada" | "cancelada";
  createdAt: string;
};
type BookingProject = {
  kind: "booking-workspace";
  id: string;
  name: string;
  services: Service[];
  reservations: Reservation[];
  updatedAt: string;
};

const STORAGE_ID = "pagenova-booking-workspace";
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function minutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
function timeLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });
}
function overlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}
function makeId(): string {
  return crypto.randomUUID();
}
function calendarStamp(date: string, time: string): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}
function escapeCalendar(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n")
    .replaceAll(",", "\\,").replaceAll(";", "\\;");
}
function downloadCalendar(reservation: Reservation, service: Service, business: string) {
  const end = minutes(reservation.time) + service.duration;
  const endDate = new Date(`${reservation.date}T00:00:00`);
  endDate.setMinutes(end);
  const endStamp = calendarStamp(localDate(endDate), `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`);
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PageNova//Agendamento//PT-BR",
    "BEGIN:VEVENT", `UID:${reservation.id}@pagenova.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${calendarStamp(reservation.date, reservation.time)}`,
    `DTEND:${endStamp}`,
    `SUMMARY:${escapeCalendar(`${service.name} - ${business}`)}`,
    `DESCRIPTION:${escapeCalendar(`Cliente: ${reservation.customer}\nTelefone: ${reservation.phone}\n${reservation.notes}`)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agendamento-${reservation.date}-${reservation.time.replace(":", "")}.ics`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BookingPage() {
  const [project, setProject] = useState<BookingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [business, setBusiness] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState(() => localDate(new Date()));
  const [time, setTime] = useState("");
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [view, setView] = useState<"reservar" | "agenda" | "servicos">("reservar");

  useEffect(() => {
    readPageNovaProject<BookingProject>(STORAGE_ID).then((saved) => {
      if (saved?.kind === "booking-workspace") {
        setProject(saved);
        setBusiness(saved.name);
        setSelectedService(saved.services[0]?.id ?? "");
      }
    }).catch(() => setError("Não foi possível carregar os agendamentos deste navegador."))
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: BookingProject) {
    setError("");
    try {
      await savePageNovaProject(next.id, next);
      setProject(next);
      setNotice("Alterações salvas neste navegador.");
    } catch {
      setError("Não foi possível salvar. Verifique o espaço disponível neste navegador.");
    }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = business.trim();
    if (!name) return;
    await persist({
      kind: "booking-workspace", id: STORAGE_ID, name,
      services: [], reservations: [], updatedAt: new Date().toISOString(),
    });
    setView("servicos");
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !serviceName.trim() || duration < 15 || duration > 480 || price < 0) return;
    const service: Service = { id: makeId(), name: serviceName.trim(), duration, price };
    await persist({ ...project, services: [...project.services, service], updatedAt: new Date().toISOString() });
    setSelectedService(service.id);
    setServiceName("");
    setView("reservar");
  }

  const service = project?.services.find((item) => item.id === selectedService);
  const slots = useMemo(() => {
    if (!service || !project || !date) return [];
    const day = new Date(`${date}T12:00:00`).getDay();
    if (day === 0) return [];
    const starts: string[] = [];
    const today = localDate(new Date());
    for (let start = 9 * 60; start + service.duration <= 18 * 60; start += 15) {
      if (overlap(start, start + service.duration, 12 * 60, 13 * 60)) continue;
      const label = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
      if (date < today || (date === today && start <= new Date().getHours() * 60 + new Date().getMinutes())) continue;
      const busy = project.reservations.some((reservation) => {
        if (reservation.status !== "confirmada" || reservation.date !== date) return false;
        const bookedService = project.services.find((item) => item.id === reservation.serviceId);
        const bookedStart = minutes(reservation.time);
        return overlap(start, start + service.duration, bookedStart, bookedStart + (bookedService?.duration ?? 60));
      });
      if (!busy) starts.push(label);
    }
    return starts;
  }, [date, project, service]);

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !service || !slots.includes(time) || !customer.trim() || !email.trim()) {
      setError("Escolha um horário disponível e informe nome e e-mail.");
      return;
    }
    const reservation: Reservation = {
      id: makeId(), serviceId: service.id, customer: customer.trim(),
      email: email.trim(), phone: phone.trim(), notes: notes.trim(),
      date, time, status: "confirmada", createdAt: new Date().toISOString(),
    };
    await persist({
      ...project, reservations: [...project.reservations, reservation],
      updatedAt: new Date().toISOString(),
    });
    setTime("");
    setCustomer("");
    setEmail("");
    setPhone("");
    setNotes("");
    setView("agenda");
  }

  async function cancelReservation(id: string) {
    if (!project || !window.confirm("Cancelar esta reserva?")) return;
    await persist({
      ...project,
      reservations: project.reservations.map((item) =>
        item.id === id ? { ...item, status: "cancelada" as const } : item),
      updatedAt: new Date().toISOString(),
    });
  }

  async function removeService(id: string) {
    if (!project) return;
    if (project.reservations.some((item) => item.serviceId === id)) {
      setError("Este serviço possui reservas. Cancele ou mantenha o serviço para preservar o histórico.");
      return;
    }
    if (!window.confirm("Excluir este serviço?")) return;
    const services = project.services.filter((item) => item.id !== id);
    await persist({ ...project, services, updatedAt: new Date().toISOString() });
    if (selectedService === id) setSelectedService(services[0]?.id ?? "");
  }

  const ordered = [...(project?.reservations ?? [])].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const active = ordered.filter((item) => item.status === "confirmada");
  const nextSeven = active.filter((item) => {
    const timestamp = new Date(`${item.date}T${item.time}`).getTime();
    return timestamp >= Date.now() && timestamp < Date.now() + 7 * 86400000;
  }).length;

  return (
    <div className="min-h-screen bg-[#090b13] text-white">
      <AppHeader title="Agendamento" />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <Link href="/app/builder" className="text-sm text-emerald-300 hover:text-emerald-200">← Voltar às opções</Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">PageNova · Agendamento</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {project ? project.name : "Organize sua agenda"}
            </h1>
            <p className="mt-4 max-w-2xl text-white/55">
              Configure serviços, ofereça horários livres e acompanhe as reservas em uma agenda organizada.
            </p>
          </div>
          {project && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200">Salvo neste navegador</span>}
        </div>

        {error && <div role="alert" className="mt-7 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
        {notice && !error && <div role="status" className="mt-7 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">{notice}</div>}

        {loading ? <p className="mt-10 text-white/60">Carregando agenda…</p> : !project ? (
          <form onSubmit={createWorkspace} className="mt-10 max-w-xl rounded-3xl border border-white/10 bg-[#131723] p-7">
            <h2 className="text-2xl font-semibold">Criar espaço de agendamento</h2>
            <p className="mt-2 text-sm text-white/50">Comece pelo nome do negócio. Depois cadastre os serviços e horários.</p>
            <label className="mt-7 block text-sm">Nome do negócio
              <input required maxLength={90} value={business} onChange={(event) => setBusiness(event.target.value)}
                placeholder="Ex.: Clínica Aurora" className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-4 outline-none focus:border-emerald-400" />
            </label>
            <button className="mt-6 rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-[#06251c] hover:bg-emerald-300">Criar agenda →</button>
          </form>
        ) : (
          <>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ["Serviços", project.services.length],
                ["Reservas confirmadas", active.length],
                ["Próximos 7 dias", nextSeven],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-[#131723] p-5">
                  <p className="text-sm text-white/50">{label}</p>
                  <strong className="mt-3 block text-3xl">{value}</strong>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {([
                ["reservar", "Nova reserva"], ["agenda", "Agenda"], ["servicos", "Serviços"],
              ] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => { setView(key); setError(""); }}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${view === key ? "bg-emerald-400 text-[#06251c]" : "bg-white/5 text-white/65 hover:bg-white/10"}`}>
                  {label}
                </button>
              ))}
            </div>

            {view === "servicos" && (
              <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_1fr]">
                <form onSubmit={addService} className="h-fit rounded-2xl border border-white/10 bg-[#131723] p-6">
                  <h2 className="text-xl font-semibold">Adicionar serviço</h2>
                  <label className="mt-5 block text-sm">Nome
                    <input required maxLength={90} value={serviceName} onChange={(event) => setServiceName(event.target.value)}
                      placeholder="Ex.: Consulta inicial" className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                  </label>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <label className="text-sm">Duração (minutos)
                      <input type="number" min="15" max="480" step="15" required value={duration}
                        onChange={(event) => setDuration(Number(event.target.value))}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                    </label>
                    <label className="text-sm">Preço (R$)
                      <input type="number" min="0" step="0.01" required value={price}
                        onChange={(event) => setPrice(Number(event.target.value))}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                    </label>
                  </div>
                  <button className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-[#06251c]">Salvar serviço</button>
                </form>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Serviços cadastrados</h2>
                  {project.services.length === 0 && <p className="rounded-xl border border-dashed border-white/20 p-6 text-white/50">Cadastre o primeiro serviço para liberar as reservas.</p>}
                  {project.services.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#131723] p-5">
                      <div><strong>{item.name}</strong><p className="mt-1 text-sm text-white/50">{item.duration} min · {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
                      <button type="button" onClick={() => removeService(item.id)} className="text-sm text-red-300 hover:text-red-200">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "reservar" && (
              <div className="mt-8 grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
                <form onSubmit={reserve} className="rounded-2xl border border-white/10 bg-[#131723] p-6">
                  <h2 className="text-xl font-semibold">Nova reserva</h2>
                  {project.services.length === 0 ? <p className="mt-5 text-white/55">Cadastre um serviço na aba Serviços antes de reservar.</p> : (
                    <>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">Serviço
                          <select required value={selectedService} onChange={(event) => { setSelectedService(event.target.value); setTime(""); }}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-[#10131d] p-3">
                            <option value="">Selecione</option>
                            {project.services.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.duration} min</option>)}
                          </select>
                        </label>
                        <label className="text-sm">Data
                          <input required type="date" min={localDate(new Date())} value={date}
                            onChange={(event) => { setDate(event.target.value); setTime(""); }}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-[#10131d] p-3" />
                        </label>
                      </div>
                      <p className="mt-5 text-sm font-semibold">Horários disponíveis</p>
                      <p className="mt-1 text-xs text-white/45">Segunda a sábado, 9h–12h e 13h–18h. Reservas simultâneas são bloqueadas.</p>
                      <div className="mt-4 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                        {slots.length === 0 && <p className="text-sm text-white/50">Nenhum horário disponível para esta data e serviço.</p>}
                        {slots.map((slot) => (
                          <button key={slot} type="button" onClick={() => setTime(slot)}
                            aria-pressed={time === slot}
                            className={`rounded-lg border px-3 py-2 text-sm ${time === slot ? "border-emerald-400 bg-emerald-400 text-[#06251c]" : "border-white/15 hover:border-emerald-400/60"}`}>
                            {slot}
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">Nome do cliente
                          <input required maxLength={100} value={customer} onChange={(event) => setCustomer(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                        </label>
                        <label className="text-sm">E-mail
                          <input required type="email" maxLength={150} value={email} onChange={(event) => setEmail(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                        </label>
                        <label className="text-sm">Telefone
                          <input type="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                        </label>
                        <label className="text-sm">Observações
                          <input maxLength={250} value={notes} onChange={(event) => setNotes(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-emerald-400" />
                        </label>
                      </div>
                      <button disabled={!time} className="mt-6 rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-[#06251c] disabled:cursor-not-allowed disabled:opacity-40">
                        Confirmar reserva →
                      </button>
                    </>
                  )}
                </form>
                <aside className="h-fit rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Resumo</p>
                  <h2 className="mt-4 text-2xl font-semibold">{service?.name ?? "Selecione um serviço"}</h2>
                  <p className="mt-3 text-white/60">{service ? `${service.duration} minutos · ${service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "A duração determina os horários livres."}</p>
                  <p className="mt-5 text-white/70">{date ? timeLabel(date) : "Selecione uma data"}{time ? ` · ${time}` : ""}</p>
                  <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-6 text-white/45">
                    As reservas são administradas neste navegador. Esta versão não envia e-mails nem recebe agendamentos de visitantes pela internet.
                  </p>
                </aside>
              </div>
            )}

            {view === "agenda" && (
              <div className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Todas as reservas</h2>
                  <span className="text-sm text-white/50">{ordered.length} no histórico</span>
                </div>
                {ordered.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-white/20 p-7 text-white/50">A agenda está vazia. Crie a primeira reserva.</p>}
                <div className="mt-5 space-y-3">
                  {ordered.map((item) => {
                    const itemService = project.services.find((entry) => entry.id === item.serviceId);
                    return (
                      <article key={item.id} className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/10 bg-[#131723] p-5">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <strong className="text-lg">{item.customer}</strong>
                            <span className={`rounded-full px-2 py-1 text-xs ${item.status === "confirmada" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-white/50"}`}>{item.status}</span>
                          </div>
                          <p className="mt-2 text-sm text-white/70">{item.date.split("-").reverse().join("/")} · {item.time} · {itemService?.name ?? "Serviço removido"}</p>
                          <p className="mt-1 text-sm text-white/45">{item.email}{item.phone ? ` · ${item.phone}` : ""}</p>
                          {item.notes && <p className="mt-2 text-sm text-white/55">{item.notes}</p>}
                        </div>
                        <div className="flex gap-3">
                          {itemService && item.status === "confirmada" && <button type="button" onClick={() => downloadCalendar(item, itemService, project.name)} className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5">Baixar .ics</button>}
                          {item.status === "confirmada" && <button type="button" onClick={() => cancelReservation(item.id)} className="rounded-lg border border-red-400/25 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10">Cancelar</button>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}