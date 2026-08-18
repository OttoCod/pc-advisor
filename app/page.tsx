import Link from "next/link";

interface Option {
  title: string;
  description: string;
  cta: string;
  href: string | null;
}

const OPTIONS: Option[] = [
  {
    title: "Analizar mi PC",
    description:
      "Cargá tus componentes y mirá dónde estás parado: FPS estimados, cuello de botella y qué actualizar primero.",
    cta: "Analizar ahora",
    href: "/analizar",
  },
  {
    title: "¿Qué juegos puedo jugar?",
    description:
      "Una lista completa de juegos con FPS estimados en bajo, medio, alto y ultra, calculados para tu hardware.",
    cta: "Ver juegos",
    href: "/analizar",
  },
  {
    title: "Quiero mejorar mi PC",
    description:
      "Te decimos qué actualizar primero — CPU, GPU o RAM — y por qué, según dónde está el límite real de tu equipo.",
    cta: "Ver recomendación",
    href: "/analizar",
  },
  {
    title: "Estoy pensando en comprar una PC",
    description:
      "Comparación de configuraciones completas y guía de compra según presupuesto y uso.",
    cta: "Próximamente",
    href: null,
  },
];

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function OptionCard({ option, index, delay }: { option: Option; index: number; delay: number }) {
  const inner = (
    <div className="group flex h-full flex-col justify-between rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-dim">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-fg-muted">{String(index + 1).padStart(2, "0")}</span>
          {!option.href && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-fg-muted">
              Próximamente
            </span>
          )}
        </div>
        <h2 className="mt-3 font-display text-lg font-semibold text-fg">{option.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{option.description}</p>
      </div>
      <span
        className={`mt-6 inline-flex items-center gap-1.5 text-sm font-medium ${
          option.href ? "text-accent" : "text-fg-muted"
        }`}
      >
        {option.cta}
        {option.href && (
          <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
      </span>
    </div>
  );

  if (!option.href) {
    return (
      <div className="animate-fade-up h-full" style={{ animationDelay: `${delay}ms` }}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={option.href} className="animate-fade-up block h-full" style={{ animationDelay: `${delay}ms` }}>
      {inner}
    </Link>
  );
}

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="animate-breathe pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/20 blur-[120px]"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.2em] text-accent">
            PC Advisor
          </p>
          <h1
            className="animate-fade-up mt-4 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            ¿Qué querés hacer con tu PC?
          </h1>
          <p
            className="animate-fade-up mx-auto mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Decime qué PC tenés, qué juegos jugás y cuánto querés gastar. Nosotros te ayudamos a
            decidir qué hacer con ella.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/analizar"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Analizar mi PC
            </Link>
            <Link
              href="/analizar"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-fg transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-dim"
            >
              Ver qué puedo jugar
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((option, index) => (
            <OptionCard key={option.title} option={option} index={index} delay={index * 90} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <p className="animate-fade-up rounded-lg border border-border bg-surface px-5 py-4 text-center text-xs leading-relaxed text-fg-muted">
          Todos los FPS que mostramos son estimaciones, no mediciones. Siempre se presentan como
          rangos, con un nivel de confianza (alta, media o baja) según si están respaldados por un
          benchmark real o son interpolados a partir del hardware que cargaste.
        </p>
      </section>
    </main>
  );
}
