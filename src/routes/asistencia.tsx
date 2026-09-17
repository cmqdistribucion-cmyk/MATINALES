import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listarPersonas,
  obtenerCapacitacionActiva,
  guardarMarcaAsistencia,
  guardarMarcasMasivas,
  listarMarcasCapacitacion,
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
  const qc = useQueryClient();
  const { data: personas = [] } = useQuery({ queryKey: ["personas"], queryFn: listarPersonas });
  const [marcas, setMarcas] = useState<Record<string, boolean>>({});
  const [capActiva, setCapActiva] = useState<{ id?: string; titulo?: string | undefined } | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const capActivaRef = useRef<string | null>(null);
  const cargadoRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const cap = await obtenerCapacitacionActiva();
        if (cap) {
          capActivaRef.current = cap.id;
          setCapActiva({ id: cap.id, titulo: cap.titulo });
          try {
            const marcasBD = await listarMarcasCapacitacion(cap.id);
            setMarcas((prev) => ({ ...prev, ...marcasBD }));
          } catch (e) {
            console.error("Error cargando marcas de BD", e);
          }
        } else {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const est: EstadoGuardado = JSON.parse(raw);
              if (est?.marcas) setMarcas((prev) => ({ ...prev, ...est.marcas }));
              if (est?.capacitacionId) {
                capActivaRef.current = est.capacitacionId;
                setCapActiva({ id: est.capacitacionId, titulo: est.titulo });
              }
            }
          } catch {}
        }
      } catch (e) {
        console.error(e);
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const est: EstadoGuardado = JSON.parse(raw);
            if (est?.marcas) setMarcas((prev) => ({ ...prev, ...est.marcas }));
            if (est?.capacitacionId) {
              capActivaRef.current = est.capacitacionId;
              setCapActiva({ id: est.capacitacionId, titulo: est.titulo });
            }
          }
        } catch {}
      } finally {
        cargadoRef.current = true;
      }
    })();
    const intervalo = setInterval(async () => {
      try {
        const cap = await obtenerCapacitacionActiva();
        if (cap && cap.id !== capActivaRef.current) {
          capActivaRef.current = cap.id;
          setCapActiva({ id: cap.id, titulo: cap.titulo });
          try {
            const marcasBD = await listarMarcasCapacitacion(cap.id);
            setMarcas((prev) => ({ ...prev, ...marcasBD }));
          } catch {}
        } else if (!cap && capActivaRef.current) {
          capActivaRef.current = null;
          setCapActiva(null);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let base: EstadoGuardado = { marcas: {} };
      if (raw) base = JSON.parse(raw) as EstadoGuardado;
      base.marcas = marcas;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    } catch {}
  }, [marcas]);

  async function marcarIndividual(personaId: string, presente: boolean) {
    setMarcas((m) => ({ ...m, [personaId]: presente }));
    const persona = personas.find((p) => p.id === personaId);
    const capId = capActivaRef.current;
    if (!persona || !capId) return;
    setSincronizando(true);
    try {
      await guardarMarcaAsistencia(capId, { id: persona.id, nombre: persona.nombre, area: persona.area }, presente);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar la marca en la nube");
    } finally {
      setSincronizando(false);
    }
    void qc.invalidateQueries({ queryKey: ["asistencias", capId] });
  }

  async function marcarTodos(valor: boolean) {
    const m: Record<string, boolean> = {};
    personas.forEach((p) => (m[p.id] = valor));
    setMarcas(m);
    const capId = capActivaRef.current;
    if (capId) {
      setSincronizando(true);
      try {
        await guardarMarcasMasivas(
          capId,
          personas.map((p) => ({ persona: { id: p.id, nombre: p.nombre, area: p.area }, presente: valor })),
        );
        toast.success(valor ? "Todos marcados como presentes y guardados" : "Todos marcados como ausentes y guardados");
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron guardar todas las marcas en la nube");
      } finally {
        setSincronizando(false);
      }
    } else {
      toast.success(valor ? "Todos marcados como presentes" : "Todos marcados como ausentes");
    }
    void qc.invalidateQueries({ queryKey: ["asistencias", capId] });
  }

  const presentes = personas.filter((p) => marcas[p.id] === true).length;
  const ausentes = personas.filter((p) => marcas[p.id] === false).length;

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
              ✅ Las marcas se guardan EN VIVO en la nube y se registran al finalizar en el cronómetro (funciona incluso en navegadores/distintos dispositivos).
            </p>
            {sincronizando && (
              <p className="mt-2 text-xs font-semibold text-cream/70">Sincronizando con la nube…</p>
            )}
          </div>
        )}
        {!capActiva?.id && (
          <div className="rounded-[min(1vw,16px)] bg-yellow-100 p-5 text-ink ring-1 ring-yellow-300">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-800">
              Sin MATINAL activa
            </p>
            <p className="mt-1 text-base font-semibold leading-tight">
              Primero iniciá una MATINAL en la página del Cronómetro.
            </p>
            <p className="mt-1 text-sm text-yellow-900/70">
              Si no ves la MATINAL que iniciaste, esperá unos segundos o recargá la página.
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
                Marcá Sí o No por persona en cualquier momento. Todo se guarda en tiempo real en la nube.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => marcarTodos(true)}
                disabled={!capActiva?.id}
                className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-cream ring-1 ring-moss/30 shadow-sm shadow-moss/10 hover:bg-moss/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Marcar todos presentes
              </button>
              <button
                onClick={() => marcarTodos(false)}
                disabled={!capActiva?.id}
                className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-cream ring-1 ring-signal/30 shadow-sm shadow-signal/10 hover:bg-signal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                    onClick={() => marcarIndividual(p.id, true)}
                    disabled={!capActiva?.id}
                    className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-steel ${
                      marcas[p.id] === true
                        ? "bg-moss font-semibold text-cream"
                        : "bg-card font-medium text-ink/40"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => marcarIndividual(p.id, false)}
                    disabled={!capActiva?.id}
                    className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-steel ${
                      marcas[p.id] === false
                        ? "bg-signal font-semibold text-cream"
                        : "bg-card font-medium text-ink/40"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
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
