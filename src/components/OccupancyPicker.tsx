import { useEffect, useRef, useState } from 'react';
import { Baby, ChevronDown, Minus, Plus, Users } from 'lucide-react';
import { Button, Select } from './ui';
import { CHILD_AGE_OPTIONS, cn } from '../lib/utils';

interface Props {
  adults: number;
  childrenAges: number[];
  onChange: (v: { adults: number; childrenAges: number[] }) => void;
  maxGuests?: number;
}

function Stepper({ icon: Icon, label, value, min, onDec, onInc }: {
  icon: typeof Users;
  label: string;
  value: number;
  min: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon size={16} className="text-slate-400" /> {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDec}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center text-sm font-bold text-slate-800">{value}</span>
        <button
          type="button"
          onClick={onInc}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-50 cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Campo "Ocupação": mostra o resumo (ex.: "2 Adultos · 1 Criança") e abre um
 * popup com steppers de adultos/crianças e, se houver crianças, um seletor de
 * idade por criança (usado na gratuidade do plano tarifário).
 */
export function OccupancyPicker({ adults, childrenAges, onChange, maxGuests }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const childCount = childrenAges.length;
  const setAdults = (n: number) => onChange({ adults: Math.max(1, n), childrenAges });
  const setChildCount = (n: number) => {
    const next = Math.max(0, n);
    const ages = childrenAges.slice(0, next);
    while (ages.length < next) ages.push(0);
    onChange({ adults, childrenAges: ages });
  };
  const setChildAge = (idx: number, age: number) => {
    const ages = [...childrenAges];
    ages[idx] = age;
    onChange({ adults, childrenAges: ages });
  };

  const summary = `${adults} adulto${adults === 1 ? '' : 's'}${childCount ? ` · ${childCount} criança${childCount === 1 ? '' : 's'}` : ''}`;
  const total = adults + childCount;
  const overCapacity = Boolean(maxGuests && total > maxGuests);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm cursor-pointer hover:border-slate-400',
          overCapacity ? 'border-amber-400' : 'border-slate-300'
        )}
      >
        <Users size={15} className="shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-slate-700">{summary}</span>
        <ChevronDown size={14} className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="divide-y divide-slate-100">
            <Stepper icon={Users} label="Adultos" value={adults} min={1} onDec={() => setAdults(adults - 1)} onInc={() => setAdults(adults + 1)} />
            <Stepper icon={Baby} label="Crianças" value={childCount} min={0} onDec={() => setChildCount(childCount - 1)} onInc={() => setChildCount(childCount + 1)} />
          </div>

          {childCount > 0 && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Idades das crianças</p>
              {childrenAges.map((age, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Criança {i + 1}</span>
                  <Select value={age} onChange={(e) => setChildAge(i, Number(e.target.value))} className="w-32">
                    {CHILD_AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
              ))}
            </div>
          )}

          <Button type="button" onClick={() => setOpen(false)} className="mt-4 w-full">Concluído</Button>
        </div>
      )}
    </div>
  );
}
