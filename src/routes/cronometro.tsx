import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Cronometro } from "@/components/Cronometro";
import {
  listarPersonas,
  iniciarCapacitacion,
  finalizarCapacitacion,
} from "@/lib/capacitaciones";

const STORAGE_KEY = "matinal-en-curso";

type EstadoGuardado = {
  capacitacionId: string;
  titulo: string;
  descripcion: string;
  marcas: Record<string, boolean>;
  startTimestamp: number;
};

export const Route = createFileRoute("/cronometro")({
  component: CronometroPage,
});

function CronometroPage() {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [capacitacionId, setCapacitacionId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [alarma12minActivada, setAlarma12minActivada] = useState(false);
  const startTimestampRef = useRef<number | null>(null);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmaActivadaRef = useRef(false);

  const { data: personas = [] } = useQuery({
    queryKey: ["personas"],
    queryFn: listarPersonas,
  });

  function reproducirBeep() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.value = 1100;
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.25);
      }, 300);
    } catch (e) {
      console.error("No se pudo reproducir el beep:", e);
    }
  }

  function detenerAlarma() {
    if (alarmaIntervalRef.current) {
      clearInterval(alarmaIntervalRef.current);
      alarmaIntervalRef.current = null;
    }
    alarmaActivadaRef.current = false;
    setAlarma12minActivada(false);
  }

  function iniciarAlarma() {
    if (alarmaActivadaRef.current) return;
    alarmaActivadaRef.current = true;
    setAlarma12minActivada(true);
    toast.warning("¡Alcanzaste los 12 minutos!", {
      description: "Se están emitiendo bips de alarma",
      duration: 5000,
    });
    reproducirBeep();
    alarmaIntervalRef.current = setInterval(() => {
      reproducirBeep();
    }, 1500);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const est: EstadoGuardado = JSON.parse(raw);
        if (est && est.capacitacionId) {
          setCapacitacionId(est.capacitacionId);
          setTitulo(est.titulo ?? "");
          setDescripcion(est.descripcion ?? "");
          startTimestampRef.current = est.startTimestamp ?? Date.now();
          const transcurridos = Math.floor((Date.now() - startTimestampRef.current) / 1000);
          setSegundos(transcurridos > 0 ? transcurridos : 0);
          setCorriendo(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!corriendo) return;
    if (!startTimestampRef.current) return;
    intervalo.current = setInterval(() => {
      if (startTimestampRef.current) {
        const transcurridos = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        setSegundos(transcurridos > 0 ? transcurridos : 0);
        if (transcurridos >= 720 && !alarmaActivadaRef.current) {
          iniciarAlarma();
        }
      }
    }, 1000);
    return () => {
      if (intervalo.current) {
        clearInterval(intervalo.current);
        intervalo.current = null;
      }
    };
  }, [corriendo]);

  useEffect(() => {
    return () => {
      detenerAlarma();
    };
  }, []);

  function persistir(extra: Partial<EstadoGuardado> = {}) {
    if (!capacitacionId) return;
    let marcasActuales: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const est = JSON.parse(raw) as EstadoGuardado;
        marcasActuales = est.marcas ?? {};
      }
    } catch {
      /* ignore */
    }
    const payload: EstadoGuardado = {
      capacitacionId,
      titulo,
      descripcion,
      marcas: marcasActuales,
      startTimestamp: startTimestampRef.current ?? Date.now(),
      ...extra,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (capacitacionId) persistir();
  }, [titulo, descripcion, capacitacionId]);

  async function handleIniciar() {
    if (!titulo.trim()) {
      toast.error("Escribí el título de la MATINAL");
      return;
    }
    try {
      detenerAlarma();
      const nueva = await iniciarCapacitacion(titulo.trim(), descripcion.trim());
      const ts = Date.now();
      startTimestampRef.current = ts;
      setCapacitacionId(nueva.id);
      setSegundos(0);
      setCorriendo(true);
      try {
        let marcasGuardadas: Record<string, boolean> = {};
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          marcasGuardadas = (JSON.parse(raw) as EstadoGuardado).marcas ?? {};
        }
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            capacitacionId: nueva.id,
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            marcas: marcasGuardadas,
            startTimestamp: ts,
          } satisfies EstadoGuardado),
        );
      } catch {
        /* ignore */
      }
      toast.success("Cronómetro iniciado y MATINAL guardada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo iniciar la MATINAL");
    }
  }

  async function handleFinalizar() {
    if (!capacitacionId) {
      toast.error("No hay MATINAL en curso para finalizar");
      return;
    }
    detenerAlarma();
    const duracion = startTimestampRef.current
      ? Math.floor((Date.now() - startTimestampRef.current) / 1000)
      : segundos;
    if (duracion < 2) {
      toast.error("La MATINAL duró muy poco tiempo");
      return;
    }
    try {
      setGuardando(true);
      let marcasGuardadas: Record<string, boolean> = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) marcasGuardadas = (JSON.parse(raw) as EstadoGuardado).marcas ?? {};
      } catch {
        /* ignore */
      }
      const asistentes = personas.map((p) => ({
        persona_id: p.id,
        nombre: p.nombre,
        area: p.area,
        presente: marcasGuardadas[p.id] ?? false,
      }));
      await finalizarCapacitacion(capacitacionId, duracion, asistentes);
      await qc.invalidateQueries({ queryKey: ["historial"] });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setCorriendo(false);
      setFullscreen(false);
      setSegundos(0);
      setCapacitacionId(null);
      setTitulo("");
      setDescripcion("");
      startTimestampRef.current = null;
      toast.success("MATINAL guardada correctamente en el historial");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar la MATINAL");
    } finally {
      setGuardando(false);
    }
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
                Cronómetro
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cream/75">
                Tiempo de MATINAL
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
        <Cronometro
          titulo={titulo}
          descripcion={descripcion}
          onTitulo={setTitulo}
          onDescripcion={setDescripcion}
          segundos={segundos}
          corriendo={corriendo}
          onIniciar={handleIniciar}
          onFinalizar={handleFinalizar}
          pantallaCompleta={fullscreen}
          onPantallaCompleta={setFullscreen}
          alarma12min={alarma12minActivada}
          onDetenerAlarma={detenerAlarma}
        />

        {guardando && (
          <div className="rounded-[min(1vw,16px)] bg-steel p-5 text-cream ring-1 ring-steel">
            <p className="font-mono text-sm font-bold">Guardando MATINAL en historial...</p>
          </div>
        )}
      </main>
    </div>
  );
}
