"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { listPageNovaProjects } from "@/lib/pagenova-project-store";
import { renderSitePreview, type SiteProject } from "@/lib/site-builder";
import { SiteHoverPreview } from "@/components/site-hover-preview";

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

  sections: unknown[];

  visualHtml: string;
  visualBodyHtml: string;
  visualHeadHtml: string;

  fetchedAt: string;
};

const PROJECT_PREFIX =
  "lp-clone-project:";

function readProjects(): CloneProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  const projects: CloneProject[] = [];

  for (
    let index = 0;
    index < window.sessionStorage.length;
    index += 1
  ) {
    const key =
      window.sessionStorage.key(index);

    if (
      !key ||
      !key.startsWith(PROJECT_PREFIX)
    ) {
      continue;
    }

    const raw =
      window.sessionStorage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const project =
        JSON.parse(raw) as CloneProject;

      if (
        project &&
        typeof project.id === "string" &&
        project.id.length > 0
      ) {
        projects.push(project);
      }
    } catch {
      // Ignore invalid legacy storage entries.
    }
  }

  return projects.sort((a, b) => {
    const aTime =
      Date.parse(a.fetchedAt || "") || 0;

    const bTime =
      Date.parse(b.fetchedAt || "") || 0;

    return bTime - aTime;
  });
}

function projectStorageKey(
  projectId: string
) {
  return `${PROJECT_PREFIX}${projectId}`;
}

export default function PagesPage() {
  const router =
    useRouter();

  // V5B_REAL_MY_PAGES
  const [projects, setProjects] =
    useState<CloneProject[]>([]);
  const [sites, setSites] = useState<SiteProject[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [renamingId, setRenamingId] =
    useState<string | null>(null);

  const [renameValue, setRenameValue] =
    useState("");

  const loadProjects =
    useCallback(() => {
      setProjects(
        readProjects()
      );

      setLoaded(true);
    }, []);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(
        loadProjects
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [loadProjects]);

  useEffect(() => {
    listPageNovaProjects<SiteProject>().then((saved) =>
      setSites(saved.filter((item) => item?.kind === "institutional-site")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    ).catch(() => setSites([]));
  }, []);

  function openProject(
    project: CloneProject
  ) {
    window.sessionStorage.setItem(
      "lp-clone-current-project",
      project.id
    );

    router.push(
      `/app/editor/${project.id}`
    );
  }

  function beginRename(
    project: CloneProject
  ) {
    setRenamingId(project.id);
    setRenameValue(
      project.title ||
      project.domain ||
      "Landing Page"
    );
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  function confirmRename(
    project: CloneProject
  ) {
    const nextTitle =
      renameValue.trim();

    if (!nextTitle) {
      return;
    }

    const nextProject: CloneProject = {
      ...project,
      title: nextTitle,
    };

    window.sessionStorage.setItem(
      projectStorageKey(project.id),
      JSON.stringify(nextProject)
    );

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? nextProject
          : item
      )
    );

    setRenamingId(null);
    setRenameValue("");
  }

  function deleteProject(
    project: CloneProject
  ) {
    const confirmed =
      window.confirm(
        `Excluir "${project.title || project.domain || "Landing Page"}"?`
      );

    if (!confirmed) {
      return;
    }

    window.sessionStorage.removeItem(
      projectStorageKey(project.id)
    );

    const currentProjectId =
      window.sessionStorage.getItem(
        "lp-clone-current-project"
      );

    if (
      currentProjectId ===
      project.id
    ) {
      window.sessionStorage.removeItem(
        "lp-clone-current-project"
      );
    }

    setProjects((current) =>
      current.filter(
        (item) =>
          item.id !== project.id
      )
    );

    if (
      renamingId ===
      project.id
    ) {
      cancelRename();
    }
  }

  return (
    <>
      <AppHeader
        title="Meus sites"
        description="Visualize, edite e publique seus sites e páginas."
      />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {sites.length > 0 && <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Sites criados com IA</h2>
              <p className="mt-1 text-sm text-white/45">Veja a página real e continue do ponto onde parou.</p>
            </div>
            <Link href="/app/builder"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/10">
              + Novo site
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => {
              const pagesReady=Object.keys(site.pages||{}).filter(key=>Boolean(site.pages[key as keyof typeof site.pages])).length;
              const isCrmSite=site.id.length===26;
              const pagePreview=(!isCrmSite&&site.pages.home)?renderSitePreview(site,"home"):"";
              const displayName=site.name?.trim()==="Sua marca"?"Site sem nome definido":site.name||"Meu site";
              return <article key={site.id}
                className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#101714] shadow-[0_12px_35px_rgba(0,0,0,.15)] transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-[0_22px_48px_rgba(0,0,0,.28)]">
                <SiteHoverPreview title={displayName} html={pagePreview}
                  remoteProjectId={isCrmSite?site.id:undefined}
                  imageUrl={site.institutional?.portrait||site.institutional?.businessPhoto||null}/>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-300">Site com IA</span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                      {isCrmSite?"Em edição":pagesReady>=4?"Pronto para revisar":"Rascunho"}
                    </span>
                  </div>
                  <h3 className="break-words text-lg font-bold tracking-tight text-white">{displayName}</h3>
                  <p className="line-clamp-2 min-h-10 break-words text-sm leading-5 text-white/45">
                    {site.brief||"Seu projeto pode ser revisado, editado e publicado."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                    <span>{isCrmSite?"Geração em página única":`${pagesReady} de 4 páginas disponíveis`}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(site.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <Link href={`/app/builder?project=${encodeURIComponent(site.id)}`}
                    className="flex w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#052217] transition hover:bg-emerald-300">
                    Continuar / Publicar →
                  </Link>
                  <p className="text-center text-[11px] text-white/35">No celular, toque na prévia para percorrer o site.</p>
                </div>
              </article>;
            })}
          </div>
        </section>}
        {!loaded ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.015]">
            <p className="text-sm text-neutral-500">
              Carregando páginas...
            </p>
          </div>
        ) : projects.length === 0 && sites.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl text-neutral-500">
                +
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                Você ainda não criou nenhuma página
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Clone uma landing page existente ou crie uma nova página para começar.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/app/cloner"
                  className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-300"
                >
                  Clonar página
                </Link>

                <Link
                  href="/app/gerador"
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Criar página
                </Link>
              </div>
            </div>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Seus projetos
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {projects.length}{" "}
                  {projects.length === 1
                    ? "página salva"
                    : "páginas salvas"}
                </p>
              </div>

              <Link
                href="/app/cloner"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-300"
              >
                + Clonar nova página
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const isRenaming =
                  renamingId ===
                  project.id;

                const previewImage =
                  project.images?.find(
                    (image) =>
                      image.src
                  )?.src || null;

                return (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-[22px] border border-white/10 bg-[#101714] transition hover:-translate-y-0.5 hover:border-emerald-400/40"
                  >
                    <SiteHoverPreview title={project.title||project.domain||"Landing Page"}
                      html={project.visualHtml||""} imageUrl={previewImage}/>


                    <div className="p-5">
                      {isRenaming ? (
                        <div>
                          <label
                            htmlFor={`rename-${project.id}`}
                            className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500"
                          >
                            Nome da página
                          </label>

                          <input
                            id={`rename-${project.id}`}
                            value={renameValue}
                            onChange={(event) =>
                              setRenameValue(
                                event.target.value
                              )
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                confirmRename(
                                  project
                                );
                              }

                              if (
                                event.key ===
                                "Escape"
                              ) {
                                cancelRename();
                              }
                            }}
                            autoFocus
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400/60"
                          />

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                confirmRename(
                                  project
                                )
                              }
                              className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-black"
                            >
                              Salvar nome
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelRename
                              }
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-neutral-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            {project.favicon ? (
                              <img
                                src={
                                  project.favicon
                                }
                                alt=""
                                className="mt-0.5 h-5 w-5 rounded"
                              />
                            ) : null}

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-base font-semibold text-white">
                                {project.title ||
                                  project.domain ||
                                  "Landing Page"}
                              </h3>

                              <p className="mt-1 truncate text-xs text-neutral-500">
                                {project.domain}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600">
                            <span>
                              {project.images?.length ||
                                0}{" "}
                              imagens
                            </span>

                            <span>•</span>

                            <span>
                              {project.links?.length ||
                                0}{" "}
                              links
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openProject(
                                  project
                                )
                              }
                              className="rounded-xl bg-emerald-400 px-3 py-2.5 text-sm font-bold text-black transition hover:bg-emerald-300"
                            >
                              Abrir / Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                beginRename(
                                  project
                                )
                              }
                              className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
                            >
                              Renomear
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              deleteProject(
                                project
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-red-500/15 px-3 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/5"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
