import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { formatearTiempo } from "@/lib/capacitaciones";

type Props = {
  titulo: string;
  descripcion: string;
  onTitulo: (v: string) => void;
  onDescripcion: (v: string) => void;
  segundos: number;
  corriendo: boolean;
  onIniciar: () => void;
  onFinalizar: () => void;
  pantallaCompleta: boolean;
  onPantallaCompleta: (v: boolean) => void;
  alarma12min?: boolean;
  onDetenerAlarma?: () => void;
};

function Digitos({ segundos, grande }: { segundos: number; grande?: boolean }) {
  const [h, m, s] = formatearTiempo(segundos);
  return (
    <p
      className={`font-mono font-extrabold leading-none tracking-tight text-cream tabular-nums ${
        grande ? "text-[clamp(5rem,22vw,20rem)]" : "text-[clamp(3.5rem,13vw,9rem)]"
      }`}
    >
      {h}
      <span className="blink text-signal">:</span>
      {m}
      <span className="blink text-signal">:</span>
      {s}
    </p>
  );
}

export function Cronometro(props: Props) {
  const {
    titulo,
    descripcion,
    onTitulo,
    onDescripcion,
    segundos,
    corriendo,
    onIniciar,
    onFinalizar,
    pantallaCompleta,
    onPantallaCompleta,
    alarma12min,
    onDetenerAlarma,
  } = props;

  if (pantallaCompleta) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6 ${alarma12min ? "bg-signal animate-pulse" : "bg-ink"}`}>
        <p className="text-center text-2xl font-semibold uppercase tracking-tight text-cream sm:text-4xl">
          {titulo || "MATINAL"}
        </p>
        <Digitos segundos={segundos} grande />
        <div className="flex items-center gap-3">
          <span className={`size-3 rounded-full ${corriendo ? "bg-moss blink" : "bg-signal"}`} />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cream/60">
            {corriendo ? "Transcurriendo" : "Detenido"}
          </span>
        </div>
        {alarma12min && (
          <div className="flex items-center gap-3 rounded-full bg-cream px-5 py-3">
            <Volume2 className="size-5 text-signal animate-pulse" />
            <span className="text-sm font-bold text-ink">Alarma 12 min activada</span>
            <button
              onClick={onDetenerAlarma}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-cream hover:bg-ink/80 transition-colors"
            >
              <VolumeX className="size-3.5" /> Silenciar
            </button>
          </div>
        )}
        <button
          onClick={() => onPantallaCompleta(false)}
          className="inline-flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink"
        >
          <Minimize2 className="size-4" /> Salir de pantalla completa
        </button>
      </div>
    );
  }

  return (
    <section
      id="cronometro"
      className="rounded-[min(1vw,20px)] bg-card p-6 ring-1 ring-border sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="w-full max-w-[46ch]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-signal">
            Cronómetro · {corriendo ? "activo" : "en espera"}
          </p>
          <input
            value={titulo}
            onChange={(e) => onTitulo(e.target.value)}
            placeholder="Título de la MATINAL"
            className="mt-2 w-full rounded-[min(1vw,12px)] bg-cream border-2 border-border px-4 py-3 text-2xl font-semibold leading-tight text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal"
          />
          <textarea
            value={descripcion}
            onChange={(e) => onDescripcion(e.target.value)}
            rows={2}
            placeholder="Descripción (opcional)"
            className="mt-3 w-full resize-none rounded-[min(1vw,12px)] bg-cream border-2 border-border px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onIniciar}
            disabled={corriendo}
            className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream ring-1 ring-moss/40 shadow-sm shadow-moss/10 hover:bg-moss/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Iniciar
          </button>
          <button
            onClick={onFinalizar}
            disabled={!corriendo}
            className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-cream ring-1 ring-signal/40 shadow-sm shadow-signal/10 hover:bg-signal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Finalizar y guardar
          </button>
          <button
            onClick={() => onPantallaCompleta(true)}
            className="inline-flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-border hover:bg-cream/80 transition-colors"
          >
            <Maximize2 className="size-4" /> Pantalla completa
          </button>
          {alarma12min && onDetenerAlarma && (
            <button
              onClick={onDetenerAlarma}
              className="inline-flex items-center gap-2 rounded-full bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-yellow-500/40 shadow-sm shadow-yellow-500/10 hover:bg-yellow-500/90 transition-colors animate-pulse"
            >
              <Volume2 className="size-4" /> Silenciar alarma
            </button>
          )}
        </div>
      </div>
      <div className={`mt-6 flex flex-wrap items-center justify-between gap-6 rounded-[min(1vw,16px)] px-6 py-6 ring-1 ring-black/10 ${alarma12min ? "bg-signal animate-pulse" : "bg-ink"}`}>
        <Digitos segundos={segundos} />
        <div className="flex items-center gap-3">
          <span className={`size-3 rounded-full ${corriendo ? "bg-moss blink" : "bg-signal"}`} />
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${alarma12min ? "text-ink/80" : "text-cream/70"}`}>
            {alarma12min ? "¡12 MINUTOS ALCANZADOS!" : corriendo ? "Transcurriendo" : "Detenido"}
          </span>
        </div>
      </div>
    </section>
  );
}
