import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Nomina } from "@/components/Nomina";
import { listarPersonas, type Persona } from "@/lib/capacitaciones";

export const Route = createFileRoute("/nomina")({
  component: NominaPage,
});

function NominaPage() {
  const { data: personas = [] } = useQuery({ queryKey: ["personas"], queryFn: listarPersonas });

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
                Nómina
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cream/75">
                Administración de personas
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="/" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Inicio
            </a>
            <a href="/asistencia" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Asistencia
            </a>
            <a href="/cronometro" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Cronómetro
            </a>
            <a href="/historial" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Historial
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <Nomina personas={personas} />
      </main>
    </div>
  );
}
