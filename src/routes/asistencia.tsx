import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listarPersonas,
} from "@/lib/capacitaciones";

const STORAGE_KEY = "matinal-en-curso";

type EstadoGuardado = {
  capacitacionId?: string;
  titulo?: string;
  descripcion?: string;
  marcas: Record<string, boolean>;
  startTimestamp?: number;
};

export const Route = createFileRoute("/asistencia")({
  component: Asistencia,
});

function Asistencia() {
  const { data: personas = [] } = useQuery({ queryKey: ["personas"], queryFn: listarPersonas });
  const [marcas, setMarcas] = useState<Record<string, boolean>>({});
  const [capActiva, setCapActiva] = useState<{ id?: string; titulo?: string | undefined } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const est: EstadoGuardado = JSON.parse(raw);
        if (est?.marcas) setMarcas(est.marcas);
        if (est?.capacitacionId) setCapActiva({ id: est.capacitacionId, titulo: est.titulo });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let base: EstadoGuardado = { marcas: {} };
      if (raw) base = JSON.parse(raw) as EstadoGuardado;
      base.marcas = marcas;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    } catch {
      /* ignore */
    }
  }, [marcas]);

  const presentes = personas.filter((p) => marcas[p.id] === true).length;
  const ausentes = personas.filter((p) => marcas[p.id] === false).length;

  function marcarTodos(valor: boolean) {
    const m: Record<string, boolean> = {};
    personas.forEach((p) => (m[p.id] = valor));
    setMarcas(m);
    toast.success(valor ? "Todos marcados como presentes" : "Todos marcados como ausentes");
  }

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
                Asistencia
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cream/75">
                Control de asistencia
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="/" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Inicio
            </a>
            <a href="/cronometro" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Cronómetro
            </a>
            <a href="/historial" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Historial
            </a>
            <a href="/nomina" className="rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:bg-ink/15">
              Nómina
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        {capActiva?.id && (
          <div className="rounded-[min(1vw,16px)] bg-moss/90 p-5 text-cream ring-1 ring-moss">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cream/75">
              MATINAL en curso
            </p>
            <p className="mt-1 text-lg font-bold leading-tight">
              {capActiva.titulo ?? "Matinal activa"}
            </p>
            <p className="mt-1 text-sm text-cream/80">
              Las marcas se guardan automáticamente y se registran al finalizar en el cronómetro.
            </p>
          </div>
        )}

        <section
          className="rounded-[min(1vw,20px)] bg-card p-6 ring-1 ring-border sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold leading-tight">Pasar lista</h2>
              <p className="mt-1 text-sm text-ink/60">
                Marcá Sí o No por persona en cualquier momento. Todo se guarda al finalizar la MATINAL en el Cronómetro.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => marcarTodos(true)}
                className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-cream ring-1 ring-moss/30 shadow-sm shadow-moss/10 hover:bg-moss/90 transition-colors"
              >
                Marcar todos presentes
              </button>
              <button
                onClick={() => marcarTodos(false)}
                className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-cream ring-1 ring-signal/30 shadow-sm shadow-signal/10 hover:bg-signal/90 transition-colors"
              >
                Marcar todos ausentes
              </button>
              <div className="rounded-[min(1vw,12px)] bg-moss px-4 py-2 text-cream ring-1 ring-steel">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/70">
                  Presentes
                </p>
                <p className="font-mono text-2xl font-bold leading-none tabular-nums">{presentes}</p>
              </div>
              <div className="rounded-[min(1vw,12px)] bg-signal px-4 py-2 text-cream ring-1 ring-steel">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/70">
                  Ausentes
                </p>
                <p className="font-mono text-2xl font-bold leading-none tabular-nums">{ausentes}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 divide-y divide-steel/10">
            {personas.length === 0 && (
              <p className="py-4 text-sm text-ink/50">
                Cargá primero la nómina en el sector de administración.
              </p>
            )}
            {personas.map((p) => (
              <div key={p.id} className="flex items-center gap-4 py-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-steel/20 font-mono text-sm font-bold">
                  {p.nombre
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.nombre}</p>
                  {p.area && <p className="text-xs text-ink/55">{p.area}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMarcas((m) => ({ ...m, [p.id]: true }))}
                    className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-steel ${
                      marcas[p.id] === true
                        ? "bg-moss font-semibold text-cream"
                        : "bg-card font-medium text-ink/40"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setMarcas((m) => ({ ...m, [p.id]: false }))}
                    className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-steel ${
                      marcas[p.id] === false
                        ? "bg-signal font-semibold text-cream"
                        : "bg-card font-medium text-ink/40"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
