import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Control de capacitaciones — Asistencia y cronómetro" },
      {
        name: "description",
        content:
          "Tomá asistencia con Sí o No, administrá la nómina, cronometrá la capacitación en pantalla completa y descargá el historial en Excel.",
      },
      { property: "og:title", content: "Control de capacitaciones — Asistencia y cronómetro" },
      {
        property: "og:description",
        content:
          "Asistencia, nómina, cronómetro en pantalla completa e historial descargable en Excel.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const sections = [
    {
      id: "asistencia",
      title: "Asistencia",
      description: "Marcá asistencia con Sí o No para cada persona de la nómina.",
      href: "/asistencia",
      color: "bg-moss",
    },
    {
      id: "cronometro",
      title: "Cronómetro",
      description: "Cronometrá tus MATINALES con opción de pantalla completa.",
      href: "/cronometro",
      color: "bg-signal",
    },
    {
      id: "historial",
      title: "Historial",
      description: "Revisá el historial de MATINALES y descargá reportes en Excel.",
      href: "/historial",
      color: "bg-steel",
    },
    {
      id: "nomina",
      title: "Nómina",
      description: "Administrá la lista de personas cargando desde Excel o manualmente.",
      href: "/nomina",
      color: "bg-amber",
    },
  ];

  return (
    <div className="min-h-screen bg-cream font-display text-ink">
      <header className="border-b-2 border-steel bg-signal text-cream">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-[min(1vw,10px)] bg-ink text-cream outline outline-1 -outline-offset-1 outline-cream/25">
              <span className="font-mono text-lg font-extrabold leading-none">M</span>
            </div>
            <div>
              <p className="text-xl font-bold uppercase leading-none tracking-tight">
                MATINALES
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cream/75">
                Asistencia, cronómetro e historial
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/asistencia"
              className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15"
            >
              Asistencia
            </Link>
            <Link
              to="/cronometro"
              className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15"
            >
              Cronómetro
            </Link>
            <Link
              to="/historial"
              className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15"
            >
              Historial
            </Link>
            <Link
              to="/nomina"
              className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15"
            >
              Nómina
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Control de MATINALES
          </h1>
          <p className="mt-4 text-lg text-ink/60">
            Seleccioná una sección para comenzar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.id}
              to={section.href}
              className="group rounded-[min(1vw,20px)] bg-card p-8 ring-1 ring-steel transition-all hover:ring-2 hover:ring-steel/20 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className={`grid size-12 shrink-0 place-items-center rounded-full ${section.color} text-cream`}>
                  <span className="font-mono text-lg font-extrabold leading-none">
                    {section.title[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold leading-tight group-hover:text-signal transition-colors">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm text-ink/60">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
