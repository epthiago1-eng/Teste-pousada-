import { useEffect, useRef, useState } from 'react';
import { addDays, addMonths, format, isBefore, startOfDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  /** Datas que não podem ser check-in/check-out (ex.: fora do período editável). Opcional. */
  disabledBefore?: string;
}

/** Um mês do calendário de seleção de período. */
function MonthGrid({ month, checkIn, checkOut, hover, onPick, onHover, disabledBefore }: {
  month: Date;
  checkIn: string;
  checkOut: string;
  hover: string | null;
  onPick: (iso: string) => void;
  onHover: (iso: string | null) => void;
  disabledBefore?: string;
}) {
  const first = startOfMonth(month);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, -first.getDay() + i));
  const minAllowed = disabledBefore ?? '';

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-sm font-extrabold capitalize text-slate-800">{format(month, 'MMMM yyyy', { locale: ptBR })}</p>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d) => (
          <span key={d} className="pb-1 text-[10px] font-bold uppercase text-slate-400">{d}</span>
        ))}
        {cells.map((d) => {
          const iso = format(d, 'yyyy-MM-dd');
          const inMonth = d.getMonth() === month.getMonth();
          const disabled = !inMonth || iso < minAllowed;
          const isStart = iso === checkIn;
          const isEnd = iso === checkOut;
          const rangeEnd = checkOut || hover || '';
          const inRange = Boolean(checkIn && rangeEnd && iso > checkIn && iso < rangeEnd);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              onMouseEnter={() => onHover(iso)}
              className={cn(
                'flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition',
                !inMonth && 'invisible',
                disabled && inMonth ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer text-slate-700 hover:bg-brand-50',
                inRange && 'rounded-none bg-brand-100 text-brand-900',
                (isStart || isEnd) && 'bg-brand-700 font-bold text-white hover:bg-brand-700'
              )}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Campo de datas com calendário de dois meses. Clique numa data = check-in;
 * clique na próxima = check-out (igual ao seletor do QuartoVerde).
 */
export function DateRangePicker({ checkIn, checkOut, onChange, disabledBefore }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(checkIn ? new Date(`${checkIn}T12:00:00`) : new Date()));
  const [hover, setHover] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const numNights = checkIn && checkOut ? Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86400000) : 0;

  const pick = (iso: string) => {
    // Sem período ainda, ou já tem os dois (reinicia): a data clicada vira o check-in.
    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: iso, checkOut: '' });
      return;
    }
    // Clicou antes do check-in atual: essa data vira o novo check-in.
    if (iso <= checkIn) {
      onChange({ checkIn: iso, checkOut: '' });
      return;
    }
    onChange({ checkIn, checkOut: iso });
    setOpen(false);
  };

  const label = checkIn
    ? checkOut
      ? `${format(new Date(`${checkIn}T12:00:00`), 'dd MMM', { locale: ptBR })} – ${format(new Date(`${checkOut}T12:00:00`), 'dd MMM', { locale: ptBR })}`
      : `${format(new Date(`${checkIn}T12:00:00`), 'dd MMM', { locale: ptBR })} → Selecionar checkout`
    : 'Selecionar datas';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm cursor-pointer hover:border-slate-400"
      >
        <CalendarIcon size={15} className="shrink-0 text-slate-400" />
        <span className={cn('flex-1 truncate', !checkOut && 'text-slate-500')}>{label}</span>
        {numNights > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            <Moon size={12} /> {numNights}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-[min(90vw,560px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setMonth((m) => addMonths(m, -1))} disabled={isBefore(addMonths(month, 0), startOfMonth(startOfDay(new Date())))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <span />
            <button type="button" onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" onMouseLeave={() => setHover(null)}>
            <MonthGrid month={month} checkIn={checkIn} checkOut={checkOut} hover={hover} onPick={pick} onHover={setHover} disabledBefore={disabledBefore} />
            <MonthGrid month={addMonths(month, 1)} checkIn={checkIn} checkOut={checkOut} hover={hover} onPick={pick} onHover={setHover} disabledBefore={disabledBefore} />
          </div>
        </div>
      )}
    </div>
  );
}
