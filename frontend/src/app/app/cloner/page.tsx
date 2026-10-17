"use client";

import {
  FormEvent,
  useEffect,
  useCallback,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";
import {savePageNovaProject,listPageNovaProjects,deletePageNovaProject} from "@/lib/pagenova-project-store";

type CloneSection = {
  id: string;
  type: string;
  tag: string;
  heading: string | null;
  text: string;

  links: Array<{
    text: string;
    href: string;
  }>;

  images: Array<{
    src: string;
    alt: string;
  }>;
};

type CloneProject = {
  id: string;
  sourceUrl: string;
  finalUrl: string;
  domain: string;
  title: string;
  description: string;
  favicon: string | null;

  headings: string[];
  texts: string[];

  links: Array<{
    text: string;
    href: string;
  }>;

  images: Array<{
    src: string;
    alt: string;
  }>;

  sections: CloneSection[];

  visualHtml: string;
  visualBodyHtml: string;
  visualHeadHtml: string;

  fetchedAt: string;
  updatedAt?: string;
};

type CloneResponse = {
  ok: boolean;
  error?: string;
  code?: string;

  project?: CloneProject;
  engine?: "hydrated-browser-v3" | "static-html-fallback-v3";
  warnings?: string[];

  stats?: {
    headings: number;
    texts: number;
    links: number;
    images: number;
    sections: number;
    stylesheets?: number;
    recoveredImages?: number;
    desktopCaptured?: boolean;
    desktopImageCount?: number;
    mobileImageCount?: number;
    desktopBrokenImages?: number;
    mobileBrokenImages?: number;
  };
};

export default function ClonerPage() {
  const router =
    useRouter();

  const [url, setUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<CloneResponse | null>(
      null
    );
  const [savedClones,setSavedClones]=useState<CloneProject[]>([]);
  const [libraryBusy,setLibraryBusy]=useState(true);
  const [libraryError,setLibraryError]=useState("");
  const refreshSavedClones=useCallback(async()=>{
    try{
      const items=await listPageNovaProjects<CloneProject>();
      const clones=items.filter((item):item is CloneProject=>
        !!item&&typeof item.id==="string"&&/^[a-f0-9-]{36}$/i.test(item.id)&&
        typeof item.sourceUrl==="string"&&/^https?:\/\//.test(item.sourceUrl)&&
        typeof item.visualHtml==="string"&&item.visualHtml.length>0);
      clones.sort((a,b)=>Date.parse(b.updatedAt||b.fetchedAt||"")-Date.parse(a.updatedAt||a.fetchedAt||""));
      setSavedClones(clones);
      setLibraryError("");
    }catch{
      setLibraryError("Não foi possível ler os projetos deste dispositivo. Verifique as permissões de armazenamento do navegador.");
    }finally{setLibraryBusy(false);}
  },[]);
  useEffect(()=>{
    void refreshSavedClones();
    const onFocus=()=>{void refreshSavedClones();};
    window.addEventListener("focus",onFocus);
    window.addEventListener("pageshow",onFocus);
    return ()=>{window.removeEventListener("focus",onFocus);window.removeEventListener("pageshow",onFocus);};
  },[refreshSavedClones]);
  async function removeSavedClone(id:string){
    const clone=savedClones.find(item=>item.id===id);
    if(!clone||!window.confirm(`Excluir o projeto "${clone.title||clone.domain}" deste dispositivo? Essa ação não pode ser desfeita.`))return;
    try{
      await deletePageNovaProject(id);
      sessionStorage.removeItem(`lp-clone-project:${id}`);
      sessionStorage.removeItem(`lp-clone-temp:${id}`);
      setSavedClones(items=>items.filter(item=>item.id!==id));
    }catch{setLibraryError("Não foi possível excluir o projeto. Tente novamente.");}
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    const normalizedUrl =
      url.trim();

    if (!normalizedUrl) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await fetch(
          "/api/cloner/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              url: normalizedUrl,
            }),
          }
        );

      const data =
        (await response.json()) as CloneResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "Não foi possível analisar a página."
        );
      }

      setResult(data);
      if(data.project){
        const saved={...data.project,updatedAt:new Date().toISOString()};
        try{
          await savePageNovaProject(saved.id,saved);
          await refreshSavedClones();
        }catch{
          setLibraryError("A clonagem abriu, mas este navegador não permitiu salvá-la. Use o editor e exporte o resultado.");
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível analisar a página."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openEditor() {
    if (!result?.project) {
      return;
    }

    const project:CloneProject =
      {...result.project,updatedAt:new Date().toISOString()};

    sessionStorage.setItem(
      `lp-clone-temp:${project.id}`,
      JSON.stringify(project)
    );

    sessionStorage.setItem(
      "lp-clone-current-project",
      project.id
    );
    try {
      await savePageNovaProject(project.id,project);
    } catch (cause) {
      console.warn("[PageNova] Cloner IndexedDB save unavailable",cause);
      // Temporary session copy remains readable by the editor.
    }
    void refreshSavedClones();
    router.push(`/app/editor/${project.id}`);
  }

  return (
    <>
      <header className="border-b border-white/10 bg-[#0b0b0b]/90 px-5 py-5 text-center backdrop-blur">
        <h1 className="text-xl font-bold tracking-tight text-white">Clonar site</h1>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-neutral-400">Preserve a estrutura, os estilos e as imagens públicas da página para editar na PageNova.</p>
      </header>

      <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#0b100d] text-[#f2f6f1]">
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-[-340px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[#467f3b]/[.10] blur-[120px]" />
          <div className="absolute -left-48 top-[360px] h-[420px] w-[420px] rounded-full bg-[#8fec78]/[.055] blur-[120px]" />
          <div className="absolute right-[-220px] top-[180px] h-[520px] w-[520px] rounded-full bg-[#467f3b]/[.07] blur-[140px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 py-10 text-center sm:px-6 md:py-14 lg:py-16">
          {/* Hero */}
          <section className="flex flex-col items-center justify-center gap-7 border-b border-white/[.08] pb-10 lg:pb-12">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8fec78]/20 bg-[#8fec78]/[.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-[#a8f494]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8fec78] shadow-[0_0_12px_rgba(80,220,169,.8)]" />
                PageNova Cloner
              </div>

              <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-[-.045em] text-white sm:text-5xl lg:text-[58px] lg:leading-[1.02]">
                Clone a estrutura e o visual da página para editar.
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
                Cole a URL de uma página pública. A PageNova abre a página em um navegador isolado para capturar o
                conteúdo já renderizado e suas imagens. Os scripts originais não são incluídos no site publicado.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pb-1 text-xs text-white/45">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[.035] text-[#8fec78]">
                01
              </span>
              URL
              <span className="h-px w-7 bg-white/10" />
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[.035] text-[#8fec78]">
                02
              </span>
              Análise
              <span className="h-px w-7 bg-white/10" />
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[.035] text-[#8fec78]">
                03
              </span>
              Editor
            </div>
          </section>

          {/* Main workspace */}
          <section className="mx-auto mt-8 flex max-w-3xl flex-col gap-6">
            <div className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[#0b100d]/95 shadow-[0_30px_90px_rgba(0,0,0,.24)]">
              <div className="border-b border-white/[.08] px-6 py-5 sm:px-8">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#8fec78]/20 bg-[#8fec78]/[.08] text-lg text-[#a8f494]">
                    ↗
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Importar Landing Page
                    </p>
                    <p className="mt-0.5 text-xs text-white/35">
                      Comece informando o endereço da página.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8"
              >
                <label
                  htmlFor="clone-url"
                  className="block text-center text-xs font-bold uppercase tracking-[.14em] text-white/45"
                >
                  URL da página
                </label>

                <div className="mt-3 rounded-2xl border border-white/[.10] bg-black/20 p-2 transition focus-within:border-[#8fec78]/45 focus-within:bg-black/30 focus-within:shadow-[0_0_0_4px_rgba(80,220,169,.05)] sm:flex sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center">
                    <span className="ml-3 mr-1 hidden shrink-0 text-sm text-[#8fec78] sm:block">
                      ↗
                    </span>

                    <input
                      id="clone-url"
                      type="url"
                      value={url}
                      onChange={(event) =>
                        setUrl(event.target.value)
                      }
                      placeholder="https://exemplo.com/sua-pagina"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-center text-sm text-white outline-none placeholder:text-white/35 sm:text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="mt-2 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8fec78] px-5 py-3.5 text-sm font-bold text-[#14220f] shadow-[0_12px_35px_rgba(80,220,169,.16)] transition hover:bg-[#a8f494] disabled:cursor-not-allowed disabled:opacity-40 sm:mt-0 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#14220f]/25 border-t-[#14220f]" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        Clonar página
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center justify-center gap-2 text-xs text-white/40 sm:flex-row sm:flex-wrap sm:gap-8">
                  <span>
                    Use uma URL pública iniciada em http:// ou https://
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-white/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#8fec78]/70" />
                    Importação automática
                  </span>
                </div>
              </form>

              {error && (
                <div className="mx-6 mb-6 rounded-2xl border border-red-400/15 bg-red-400/[.06] p-5 sm:mx-8 sm:mb-8">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-400/10 text-sm text-red-300">
                      !
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-red-200">
                        Não foi possível clonar esta página
                      </p>
                      <p className="mt-1 text-sm leading-6 text-red-200/60">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow explanation */}
            <aside className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-6 sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8fec78]">
                Como funciona
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  [
                    "01",
                    "Informe a URL",
                    "Cole o endereço público da página que deseja importar.",
                  ],
                  [
                    "02",
                    "A PageNova analisa",
                    "Estrutura, textos, imagens, links e seções são identificados.",
                  ],
                  [
                    "03",
                    "Continue no editor",
                    "O projeto importado fica pronto para personalização.",
                  ],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-white/[.06] bg-black/[.12] p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8fec78]/20 bg-[#142019] text-[10px] font-bold text-[#a8f494]">
                      {number}
                    </span>

                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-white/85">
                        {title}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-white/35">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 border-t border-white/[.07] pt-5">
                <p className="text-xs leading-5 text-white/30">
                  A página original não é modificada durante o processo.
                </p>
              </div>
            </aside>
          </section>

          {/* Loading */}
          {loading && (
            <section className="mt-6 overflow-hidden rounded-[28px] border border-[#8fec78]/15 bg-[#0b100d] p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#8fec78]/10" />
                  <span className="relative h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#8fec78]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div>
                      <p className="font-semibold text-white">
                        Analisando a página
                      </p>
                      <p className="mt-1 text-sm text-white/35">
                        Estamos preparando a estrutura para edição.
                      </p>
                    </div>

                    <span className="text-xs font-medium text-[#a8f494]">
                      Processando
                    </span>
                  </div>

                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[.06]">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-[#8fec78]" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Result */}
          {result?.project && (
            <section className="mt-6 overflow-hidden rounded-[28px] border border-[#8fec78]/20 bg-[#0b100d] shadow-[0_30px_100px_rgba(0,0,0,.24)]">
              <div className="border-b border-white/[.08] p-6 sm:p-8">
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center justify-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8fec78]/10 text-xs font-bold text-[#8fec78]">
                        ✓
                      </span>
                      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a8f494]">
                        Página importada
                      </p>
                    </div>

                    <h2 className="mt-4 break-words text-2xl font-semibold tracking-[-.03em] text-white sm:text-3xl">
                      {result.project.title || result.project.domain}
                    </h2>

                    <p className="mx-auto mt-2 break-all text-center text-sm text-white/45">
                      {result.project.finalUrl}
                    </p>
                    <p className={"mt-3 rounded-full border px-3 py-2 text-xs font-bold "+(result.engine==="hydrated-browser-v3"?"border-emerald-400/25 bg-emerald-400/10 text-emerald-200":"border-amber-400/25 bg-amber-400/10 text-amber-200")}>
                      {result.engine==="hydrated-browser-v3"
                        ?result.stats?.desktopCaptured
                          ?"✓ Captura visual · celular 390 px + desktop 1440 px"
                          :"⚠ Captura mobile feita, desktop pendente"
                        :"⚠ Captura estática · fidelidade limitada"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openEditor}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8fec78] px-5 py-3.5 text-sm font-bold text-[#14220f] shadow-[0_12px_35px_rgba(80,220,169,.16)] transition hover:-translate-y-0.5 hover:bg-[#a8f494]"
                  >
                    Abrir no editor
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              {result.stats?.desktopCaptured&&<div className="mx-6 mt-4 flex flex-wrap justify-center gap-3 text-xs text-white/70 sm:mx-8">
                <span className="rounded-xl border border-white/10 px-3 py-2">Mobile: {result.stats.mobileImageCount??0} imagens</span>
                <span className="rounded-xl border border-white/10 px-3 py-2">Desktop: {result.stats.desktopImageCount??0} imagens</span>
                {(result.stats.desktopBrokenImages??0)>0&&<span className="rounded-xl border border-amber-400/30 px-3 py-2 text-amber-200">Desktop: {result.stats.desktopBrokenImages} imagens da origem não carregaram</span>}
              </div>}
              {result.warnings?.length ? <div className="mx-6 mt-5 space-y-2 rounded-2xl border border-amber-400/30 bg-amber-400/[.07] px-5 py-4 text-left text-xs leading-6 text-amber-100 sm:mx-8">
                <strong className="block text-sm">Fidelidade visual parcial</strong>
                {result.warnings.map((message,index)=><p key={index}>• {message}</p>)}
                <p>Se o site utiliza estilos ou imagens privados, envie os arquivos com autorização para concluir a edição.</p>
              </div> : null}
              {result.stats && (
                <div className="grid grid-cols-2 border-b border-white/[.08] sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    ["Títulos", result.stats.headings],
                    ["Textos", result.stats.texts],
                    ["Links", result.stats.links],
                    ["Imagens", result.stats.images],
                    ["Seções", result.stats.sections],
                  ].map(([label, value], index) => (
                    <div
                      key={String(label)}
                      className={`p-5 text-center sm:p-6 ${
                        index !== 4
                          ? "border-r border-white/[.07]"
                          : ""
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/30">
                        {label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-5 p-6 sm:p-8">
                <div>
                  <p className="text-sm font-semibold text-white/80">
                    Projeto pronto para personalização
                  </p>
                  <p className="mx-auto mt-1.5 max-w-2xl text-sm leading-6 text-white/45">
                    Continue no editor para alterar textos, imagens, elementos e
                    organização visual da página importada.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-xs text-white/30">
                  <span className="h-2 w-2 rounded-full bg-[#8fec78] shadow-[0_0_12px_rgba(80,220,169,.65)]" />
                  Clonagem concluída
                </div>
              </div>
            </section>
          )}

          <section id="projetos-clonados" className="mt-10 border-t border-white/10 pt-8 pb-14 text-left" aria-label="Projetos clonados e salvos">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">Projetos clonados</h2>
                <p className="mt-1 text-xs leading-5 text-white/50 sm:text-sm">Abra seus projetos salvos neste dispositivo sem gastar outra clonagem.</p>
              </div>
              <button type="button" onClick={()=>void refreshSavedClones()} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
                Atualizar lista
              </button>
            </div>
            {libraryError&&<p role="alert" className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">{libraryError}</p>}
            {libraryBusy?<p className="rounded-xl border border-white/10 bg-white/[.03] p-5 text-sm text-white/60">Carregando projetos...</p>:
              savedClones.length===0?<div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] px-5 py-8 text-center">
                <p className="font-semibold text-white/85">Nenhum projeto salvo ainda</p>
                <p className="mt-1 text-xs text-white/50">As páginas clonadas aparecerão aqui automaticamente.</p>
              </div>:
              <div className="grid gap-3 sm:grid-cols-2">
                {savedClones.map(item=><article key={item.id} className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#142019] p-4 transition hover:border-emerald-400/30">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-white" title={item.title}>{item.title||item.domain||"Página clonada"}</h3>
                    <p className="mt-1 truncate text-xs text-emerald-200/80" title={item.finalUrl}>{item.domain||item.finalUrl}</p>
                    <p className="mt-2 text-[11px] text-white/40">Salvo em {new Date(item.updatedAt||item.fetchedAt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={()=>router.push(`/app/editor/${item.id}`)}
                      className="flex-1 rounded-lg bg-[#8fec78] px-3 py-2.5 text-xs font-bold text-[#14220f] hover:bg-[#a8f494]">Abrir e editar →</button>
                    <button type="button" onClick={()=>void removeSavedClone(item.id)}
                      className="rounded-lg border border-red-400/20 px-3 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-400/10" aria-label={`Excluir projeto ${item.title||item.domain}`}>Excluir</button>
                  </div>
                </article>)}
              </div>
            }
            <p className="mt-4 text-[11px] leading-5 text-white/35">Esses rascunhos usam armazenamento do navegador. Para mantê-los em outro aparelho ou após limpar os dados, exporte ou publique o projeto.</p>
          </section>
        </div>
      </main>
    </>
  );
}