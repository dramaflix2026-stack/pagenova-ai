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
import type { SiteProject } from "@/lib/site-builder";

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
        title="Minhas páginas"
        description="Continue seus sites e landing pages."
      />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {sites.length > 0 && <section className="mb-9">
          <h2 className="mb-4 text-xl font-semibold">Sites institucionais</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sites.map((site) =>
            <Link key={site.id} href={`/app/builder?project=${site.id}`} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 transition hover:border-emerald-400/50">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Site institucional</p>
              <h3 className="mt-3 text-xl font-bold">{site.name}</h3>
              <p className="mt-2 text-sm text-white/45">{Object.keys(site.pages).length} de 4 páginas criadas</p>
              <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">Continuar criação →</span>
            </Link>)}</div>
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
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openProject(project)
                      }
                      className="block h-48 w-full overflow-hidden border-b border-white/10 bg-[#0a0a0a] text-left"
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt=""
                          className="h-full w-full object-cover object-top opacity-80 transition hover:opacity-100"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center">
                          <div>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-lg font-bold text-emerald-400">
                              LP
                            </div>

                            <p className="mt-3 text-xs text-neutral-600">
                              Preview indisponível
                            </p>
                          </div>
                        </div>
                      )}
                    </button>

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
