"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AppHeader,
} from "@/components/app-header";

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
};

type CloneResponse = {
  ok: boolean;
  error?: string;
  code?: string;

  project?: CloneProject;

  stats?: {
    headings: number;
    texts: number;
    links: number;
    images: number;
    sections: number;
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

    const apiUrl =
      process.env
        .NEXT_PUBLIC_API_URL ||
      "";

    try {
      const response =
        await fetch(
          `${apiUrl}/api/cloner/analyze`,
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

  function openEditor() {
    if (!result?.project) {
      return;
    }

    const project =
      result.project;

    sessionStorage.setItem(
      `lp-clone-temp:${project.id}`,
      JSON.stringify(project)
    );

    sessionStorage.setItem(
      "lp-clone-current-project",
      project.id
    );

    router.push(
      `/app/editor/${project.id}`
    );
  }

  return (
    <>
      <AppHeader
        title="Clonador"
        description="Clone uma Landing Page e prepare-a para edição."
      />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <section className="rounded-3xl border border-[#8C6BFF]/20 bg-[radial-gradient(circle_at_top_left,rgba(117,71,255,0.12),transparent_34%),#111016] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)] md:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#9D83FF]/30 bg-gradient-to-br from-[#875DFF] to-[#6333F5] text-xl font-black text-white shadow-[0_12px_35px_rgba(117,71,255,0.30)]">
            ◇
          </div>

          <h2 className="mt-7 text-3xl font-bold tracking-tight">
            Qual página você quer clonar?
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
            Cole a URL. O sistema importará a estrutura,
            conteúdo e aparência da página para preparar
            uma versão editável.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <label
              htmlFor="clone-url"
              className="text-sm font-medium text-neutral-300"
            >
              URL da Landing Page
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="clone-url"
                type="url"
                value={url}
                onChange={(event) =>
                  setUrl(
                    event.target.value
                  )
                }
                placeholder="https://exemplo.com/pagina"
                disabled={loading}
                required
                className="h-14 flex-1 rounded-xl border border-white/10 bg-[#090909] px-4 text-white outline-none transition placeholder:text-neutral-700 focus:border-[#875DFF] focus:ring-4 focus:ring-[#7547FF]/10 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={loading}
                className="h-14 min-w-44 rounded-xl bg-gradient-to-r from-[#875DFF] to-[#6333F5] px-7 font-bold text-white shadow-[0_12px_35px_rgba(117,71,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(117,71,255,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Clonando..."
                  : "Clonar página"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="font-medium text-red-300">
                Não foi possível importar
              </p>

              <p className="mt-1 text-sm text-red-300/70">
                {error}
              </p>
            </div>
          )}
        </section>

        {result?.project && (
          <section className="mt-6 rounded-3xl border border-[#875DFF]/25 bg-gradient-to-br from-[#14101D] to-[#0F0D15] p-7 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#A98FFF]">
                  PÁGINA IMPORTADA
                </p>

                <h3 className="mt-3 break-words text-2xl font-bold">
                  {result.project.title}
                </h3>

                <p className="mt-2 break-all text-sm text-neutral-500">
                  {result.project.finalUrl}
                </p>
              </div>

              <button
                type="button"
                onClick={openEditor}
                className="shrink-0 rounded-xl bg-gradient-to-r from-[#875DFF] to-[#6333F5] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(117,71,255,0.22)] transition hover:-translate-y-0.5"
              >
                Abrir no editor
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                [
                  "Seções",
                  result.stats?.sections ??
                    0,
                ],
                [
                  "Títulos",
                  result.stats?.headings ??
                    0,
                ],
                [
                  "Textos",
                  result.stats?.texts ??
                    0,
                ],
                [
                  "Imagens",
                  result.stats?.images ??
                    0,
                ],
                [
                  "Links",
                  result.stats?.links ??
                    0,
                ],
              ].map(
                ([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="text-xs text-neutral-500">
                      {label}
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {value}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-medium text-white">
                Clone visual preparado
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                O documento visual foi capturado.
                Abra no editor para visualizar
                a página clonada.
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}