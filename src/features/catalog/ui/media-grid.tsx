'use client';
import Image from "next/image";
import env from "@/config";

interface MediaItem {
    id: number | string;
    url?: string | null;
    name: string;
}

interface MediaGridProps {
    items: MediaItem[];
    keptMediaIds: string[];
    onToggleKeep: (id: string) => void;
    primaryId: string | null;
    onSetPrimary: (id: string) => void;
}

export function MediaGrid({ items, keptMediaIds, onToggleKeep, primaryId, onSetPrimary }: MediaGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((m) => {
                const idStr = String(m.id);
                const checked = keptMediaIds.includes(idStr);
                const url = m.url ? `${env.strapiUrl}${m.url}` : undefined;
                return (
                    <div key={idStr} className={`relative rounded-lg border overflow-hidden ${primaryId === idStr ? 'border-gray-900' : 'border-gray-200'}`}>
                        {url ? (
                            <Image src={url} alt={m.name} width={300} height={200} className="h-28 w-full object-cover" unoptimized />
                        ) : (
                            <div className="h-28 w-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">sin imagen</div>
                        )}
                        {!checked && (
                            <div className="absolute inset-0 bg-red-600/50 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">se eliminará</span>
                            </div>
                        )}
                        <label className="absolute bottom-1 left-1 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded text-xs text-gray-800">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleKeep(idStr)}
                            />
                            mantener
                        </label>
                        {checked && (
                            <button
                                type="button"
                                onClick={() => onSetPrimary(idStr)}
                                className="absolute top-1 left-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded shadow text-gray-900"
                            >
                                {primaryId === idStr ? 'principal' : 'hacer principal'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}


