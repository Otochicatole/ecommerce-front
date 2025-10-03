'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrushCleaning, Search } from 'lucide-react';

function formatYMD(d?: string) {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0,10); } catch { return ''; }
}

// human date preview not used in current UI; kept for future badge buttons

export function SalesFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const fromRef = useRef<HTMLInputElement|null>(null);
  const toRef = useRef<HTMLInputElement|null>(null);

  useEffect(() => {
    setQ(sp.get('q') || '');
    setFrom(sp.get('from') || '');
    setTo(sp.get('to') || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(next: { q?: string; from?: string; to?: string }) {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const nf = next.from ?? from;
    const nt = next.to ?? to;
    if (nq) params.set('q', nq);
    if (nf) params.set('from', formatYMD(nf));
    if (nt) params.set('to', formatYMD(nt));
    const qs = params.toString();
    router.push(`/admin/sales${qs ? `?${qs}` : ''}`);
  }

  // check which preset is active
  function getActivePreset(): string | null {
    if (!from || !to) return null;
    
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    // Hoy
    if (from === today && to === today) return 'hoy';
    
    // 7 días
    const date7 = new Date();
    date7.setDate(now.getDate() - 6);
    const from7 = date7.toISOString().slice(0,10);
    const to7 = now.toISOString().slice(0,10);
    if (from === from7 && to === to7) return '7';
    
    // 30 días
    const date30 = new Date();
    date30.setDate(now.getDate() - 29);
    const from30 = date30.toISOString().slice(0,10);
    const to30 = now.toISOString().slice(0,10);
    if (from === from30 && to === to30) return '30';
    
    return null;
  }

  const activePreset = getActivePreset();

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow ring-1 ring-black/5 p-3">
      <div className="flex flex-col gap-3">
        <div className="w-full min-w-[240px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters({ q: e.currentTarget.value }); }}
              className="w-full rounded-full bg-gray-100/80 focus:bg-white px-10 py-2 text-sm outline-none ring-1 ring-transparent focus:ring-gray-300 transition"
              placeholder="Buscar venta (producto)"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fromRef}
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }}
            placeholder="Desde"
            className="px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm border-0 ring-1 ring-transparent focus:ring-gray-300 w-auto self-start"
            aria-label="Desde"
          />
          <input
            ref={toRef}
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }}
            placeholder="Hasta"
            className="px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm border-0 ring-1 ring-transparent focus:ring-gray-300 w-auto self-start"
            aria-label="Hasta"
          />

          <div className="ml-0 sm:ml-2 flex flex-wrap gap-2 rounded-full bg-gray-100 p-1 w-fit">
            {[
              { k: 'hoy', label: 'Hoy', calc: () => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth()+1).padStart(2,'0');
                const d = String(now.getDate()).padStart(2,'0');
                const ymd = `${y}-${m}-${d}`;
                return { from: ymd, to: ymd };
              } },
              { k: '7', label: '7 días', calc: () => { const to = new Date(); const from = new Date(); from.setDate(to.getDate()-6); return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) }; } },
              { k: '30', label: '30 días', calc: () => { const to = new Date(); const from = new Date(); from.setDate(to.getDate()-29); return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) }; } },
            ].map((p) => {
              const isActive = activePreset === p.k;
              return (
                <button 
                  key={p.k} 
                  type="button" 
                  onClick={() => { const r = p.calc(); setFrom(r.from); setTo(r.to); applyFilters({ from: r.from, to: r.to }); }} 
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white shadow-sm hover:shadow cursor-pointer'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { setQ(''); setFrom(''); setTo(''); router.push('/admin/sales'); }} className="px-4 py-2 text-xs sm:text-sm rounded-full bg-gray-100 w-fit self-start cursor-pointer"><BrushCleaning size={16} className="text-gray-500" /></button>
        </div>
      </div>
    </div>
  );
}


