import { getSales, getSalesTotalAmount } from "@/sales/infra/sales.http";
import { SalesFilters } from "@/sales/ui/sales-filters";
import Link from "next/link";
import AdminPageActions from "@/shared/ui/admin-page-actions";

export default async function SalesListPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const fromParam = typeof sp.from === 'string' ? sp.from : undefined;
  const toParam = typeof sp.to === 'string' ? sp.to : undefined;

  // default fetch: today (local) if no filters present
  function todayYmd() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const usingDefaultToday = !q && !fromParam && !toParam;
  const from = usingDefaultToday ? todayYmd() : fromParam;
  const to = usingDefaultToday ? todayYmd() : toParam;

  const pageStr = typeof sp.page === 'string' ? sp.page : '1';
  const currentPage = Math.max(1, parseInt(pageStr || '1', 10) || 1);
  const res = await getSales({ page: currentPage, pageSize: 20, q, from, to });
  const sales = Array.isArray(res?.data) ? res.data : [];
  const pagination = (res as unknown as { meta?: { pagination?: { page?: number; pageSize?: number; pageCount?: number; total?: number } } }).meta?.pagination;
  const pageCount = Math.max(1, Number(pagination?.pageCount || 1));
  const showTotal = Boolean(q || ('q' in sp) || ('from' in sp) || ('to' in sp));
  const totalAmount = showTotal ? await getSalesTotalAmount({ q, from, to }) : 0;
  const cardPadTop = showTotal ? 'pt-10 sm:pt-0' : '';
  return (
    <div className="p-4 mt-16 sm:mt-[72px] lg:mt-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Historial de ventas</h1>
        <AdminPageActions />
      </div>
      <SalesFilters />
      <div className={`bg-white/80 mt-3 relative backdrop-blur-xl rounded-2xl shadow ring-1 ring-black/5 ${cardPadTop}`}>
        {showTotal && (
          <div className="absolute top-0 right-0 flex justify-end px-4 py-2 text-lg font-semibold text-gray-900">Total: ${totalAmount.toLocaleString('es-AR')}</div>
        )}
        <div className="overflow-x-auto px-2 sm:px-4">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">${Number(s.salePrice ?? 0).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3">{s.saleDate ? new Date(s.saleDate).toLocaleString('es-AR') : '-'}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={3}>No hay ventas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        {pageCount > 1 && (
          <div className="flex justify-start sm:justify-center items-center mt-10 px-4 py-3 overflow-x-auto">
            {(() => {
              const paramsBase = new URLSearchParams();
              if (q) paramsBase.set('q', q);
              if (from) paramsBase.set('from', from);
              if (to) paramsBase.set('to', to);
              const makeHref = (p: number) => {
                const pms = new URLSearchParams(paramsBase);
                pms.set('page', String(p));
                return `/admin/sales?${pms.toString()}`;
              };
              const MAX_VISIBLE_PAGES = 7;
              const half = Math.floor(MAX_VISIBLE_PAGES / 2);
              let start = Math.max(1, currentPage - half);
              const end = Math.min(pageCount, start + MAX_VISIBLE_PAGES - 1);
              start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
              const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
              return (
                <nav className="flex items-center gap-2 whitespace-nowrap">
                  <Link href={makeHref(Math.max(1, currentPage - 1))} className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-40 bg-gray-100' : 'bg-white shadow hover:shadow-md'}`}>Prev</Link>
                  {pages.map((p) => (
                    <Link key={p} href={makeHref(p)} className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${p === currentPage ? 'bg-blue-600 text-white' : 'bg-white shadow hover:shadow-md'}`}>{p}</Link>
                  ))}
                  <Link href={makeHref(Math.min(pageCount, currentPage + 1))} className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${currentPage === pageCount ? 'pointer-events-none opacity-40 bg-gray-100' : 'bg-white shadow hover:shadow-md'}`}>Next</Link>
                </nav>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}


