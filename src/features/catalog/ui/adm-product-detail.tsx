'use client';
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import type { BlocksContent } from "@strapi/blocks-react-renderer";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import env from "@/config";
import { UploadCloud } from "lucide-react";
import { compressToUnderSize } from "@/shared/ui/image-compress";

interface ProductDetailProps {
    product: Product;
    saveAction?: (formData: FormData) => Promise<unknown>;
    uploadMediaAction?: (formData: FormData) => Promise<{ ids: number[] }>;
    setMediaAction?: (formData: FormData) => Promise<unknown>;
    deleteMediaAction?: (formData: FormData) => Promise<{ deleted: number }>;
    sizesOptions?: Array<{ id: number; documentId?: string; size: string }>;
    typeOptions?: Array<{ id: number; documentId?: string; type: string }>;
}

export default function AdmProductDetail({ product, saveAction, uploadMediaAction, setMediaAction, deleteMediaAction, sizesOptions = [], typeOptions = [] }: ProductDetailProps) {
    const router = useRouter();
    const [keptMediaIds, setKeptMediaIds] = useState<string[]>(() => (product.media ?? []).map(m => String(m.id)));
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [primaryId, setPrimaryId] = useState<string | null>(() => (product.media?.[0]?.id ? String(product.media[0].id) : null));
    const [uploaderError, setUploaderError] = useState<string | null>(null);
    const MAX_IMAGE_SIZE_MB = 1; // client-side limit per file
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

    const [name, setName] = useState(product.name ?? "");
    const [price, setPrice] = useState<string>(product.price?.toString() ?? "");
    const [offer, setOffer] = useState<boolean>(Boolean(product.offer));
    const [offerPrice, setOfferPrice] = useState<string>(product.offerPrice?.toString() ?? "");
    const [stock, setStock] = useState<string>(product.stock?.toString() ?? "");
    const [show, setShow] = useState<boolean>(Boolean(product.show));
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<string[]>(() => (product.sizes ?? []).map(s => s.documentId ?? String(s.id)));
    const [selectedTypes, setSelectedTypes] = useState<string[]>(() => (product.type_products ?? []).map(t => t.documentId ?? String(t.id)));
    const filePickerRef = useRef<HTMLInputElement | null>(null);

    function toggleValue(list: string[], value: string): string[] {
        return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
    }
    const [descriptionText, setDescriptionText] = useState<string>(() => {
        return product.description ? blocksToPlainText(product.description) : "";
    });

    async function handleAddFiles(files: File[]) {
        if (!files?.length) return;
        // Reject batch if any file is not an image
        const nonImages = files.filter(f => !(f.type && f.type.startsWith('image/')));
        if (nonImages.length > 0) {
            setUploaderError(`solo se permiten imágenes. quitá: ${nonImages.map(f => f.name).join(', ')}`);
            return;
        }
        const processed: File[] = [];
        const failed: string[] = [];
        for (const file of files) {
            if (file.size <= MAX_IMAGE_SIZE_BYTES) {
                processed.push(file);
                continue;
            }
            try {
                const compressed = await compressToUnderSize(file, { maxBytes: Math.floor(0.95 * 1024 * 1024) });
                if (compressed.size <= Math.floor(0.95 * 1024 * 1024)) {
                    processed.push(compressed);
                } else {
                    failed.push(file.name);
                }
            } catch {
                failed.push(file.name);
            }
        }
        if (failed.length > 0) {
            setUploaderError(`estas imágenes exceden 1MB, quitá estas antes de continuar: ${failed.join(', ')}`);
            return; // reject entire batch
        }
        setUploaderError(null);
        if (processed.length) setNewFiles(prev => [...prev, ...processed]);
    }

    function blocksToPlainText(blocks: BlocksContent): string {
        const lines: string[] = [];
        for (const block of blocks) {
            if (block.type === "paragraph") {
                const text = (block.children ?? [])
                    .map((child) => (child as { text?: string }).text ?? "")
                    .join("");
                lines.push(text);
            }
        }
        return lines.join("\n");
    }

    function plainTextToBlocks(text: string): BlocksContent {
        const lines = text.split(/\r?\n/);
        return lines.map((line) => ({
            type: "paragraph",
            children: [
                {
                    type: "text",
                    text: line,
                },
            ],
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsSaving(true);
            if (uploaderError) {
                return;
            }
            if (saveAction) {
                const fd = new FormData();
                fd.set('id', product.documentId ?? String(product.id ?? ''));
                fd.set('name', name);
                fd.set('price', price);
                fd.set('offer', String(offer));
                if (offer) fd.set('offerPrice', offerPrice);
                fd.set('stock', stock);
                fd.set('show', String(show));
                fd.set('descriptionText', descriptionText);
                // pass relations as documentId[] when available or numeric id fallback
                selectedSizes.forEach((id, i) => fd.append(`sizes[${i}]`, id));
                selectedTypes.forEach((id, i) => fd.append(`type_products[${i}]`, id));
                await saveAction(fd);

                // media flow: upload then set association
                if ((uploadMediaAction || setMediaAction) && (newFiles.length > 0 || keptMediaIds.length >= 0)) {
                    const newIds: number[] = [];
                    if (uploadMediaAction && newFiles.length > 0) {
                        for (const file of newFiles) {
                            try {
                                const up = new FormData();
                                up.append('files', file);
                                const res = await uploadMediaAction(up);
                                if (Array.isArray(res?.ids) && res.ids.length) newIds.push(...res.ids);
                            } catch (e) {
                                const msg = e instanceof Error ? e.message : 'Unknown upload error';
                                setUploaderError(`no se pudo subir la imagen: ${file.name}. detalle: ${msg}`);
                                return; // abort submit on first failed upload
                            }
                        }
                    }
                    if (setMediaAction) {
                        const assoc = new FormData();
                        assoc.set('id', product.documentId ?? String(product.id ?? ''));
                        const base = [...keptMediaIds.map(Number), ...newIds];
                        const chosenPrimary = (primaryId && base.includes(Number(primaryId))) ? Number(primaryId) : base[0];
                        const rest = base.filter(id => id !== chosenPrimary);
                        const finalIds = [chosenPrimary, ...rest];
                        finalIds.forEach((id, i) => assoc.append(`media[${i}]`, String(id)));
                        await setMediaAction(assoc);
                        // reflect changes locally so nuevas imágenes no aparezcan como "a eliminar"
                        setKeptMediaIds(finalIds.map(String));
                        setNewFiles([]);
                        setPrimaryId(String(finalIds[0] ?? ''));
                    }

                    // eliminar de media library los que desmarcaste
                    if (deleteMediaAction && product.media?.length) {
                        const removedIds = (product.media ?? [])
                          .map(m => Number(m.id))
                          .filter(id => !keptMediaIds.includes(String(id)));
                        if (removedIds.length > 0) {
                            const delFd = new FormData();
                            removedIds.forEach((id, i) => delFd.append(`mediaRemove[${i}]`, String(id)));
                            await deleteMediaAction(delFd);
                        }
                    }
                }
            } else {
                const payload = {
                    data: {
                        name,
                        price,
                        offer,
                        offerPrice,
                        stock,
                        show,
                        description: plainTextToBlocks(descriptionText),
                        sizes: selectedSizes.map((id) => ({ id })),
                        type_products: selectedTypes.map((id) => ({ id })),
                    },
                };
                const res = await fetch(`/api/admin/products/${product.documentId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
                    throw new Error(error || `Request failed with ${res.status}`);
                }
            }
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <main className="flex flex-col items-center p-5 min-h-screen overflow-y-auto">
                <div className="flex flex-col h-full min-h-[90vh] p-2 w-full gap-6">
                    <header className="flex border border-black/20 flex-col w-full p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1 md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                                />
                            </div>
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">sizes</label>
                                    <div className="mt-2 max-h-52 overflow-auto rounded-md border border-gray-200 p-2">
                                        {sizesOptions.map((s) => {
                                            const value = s.documentId ?? String(s.id);
                                            const checked = selectedSizes.includes(value);
                                            return (
                                                <label key={value} className="flex items-center gap-2 py-1 text-sm text-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => setSelectedSizes(prev => toggleValue(prev, value))}
                                                    />
                                                    <span>{s.size}</span>
                                                </label>
                                            );
                                        })}
                                        {sizesOptions.length === 0 && (
                                            <span className="text-xs text-gray-500">No hay sizes disponibles</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">type_products</label>
                                    <div className="mt-2 max-h-52 overflow-auto rounded-md border border-gray-200 p-2">
                                        {typeOptions.map((t) => {
                                            const value = t.documentId ?? String(t.id);
                                            const checked = selectedTypes.includes(value);
                                            return (
                                                <label key={value} className="flex items-center gap-2 py-1 text-sm text-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => setSelectedTypes(prev => toggleValue(prev, value))}
                                                    />
                                                    <span>{t.type}</span>
                                                </label>
                                            );
                                        })}
                                        {typeOptions.length === 0 && (
                                            <span className="text-xs text-gray-500">No hay tipos disponibles</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">price</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">offerPrice</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    disabled={!offer}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">stock</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">offer</label>
                                <button type="button" onClick={() => setOffer(v => !v)} className={`inline-flex h-6 w-11 items-center rounded-full transition ${offer ? 'bg-gray-900' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${offer ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">show</label>
                                <button type="button" onClick={() => setShow(v => !v)} className={`inline-flex h-6 w-11 items-center rounded-full transition ${show ? 'bg-gray-900' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${show ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">description</label>
                                <textarea
                                    value={descriptionText}
                                    onChange={(e) => setDescriptionText(e.target.value)}
                                    className="mt-1 w-full min-h-[240px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                                    spellCheck={false}
                                />
                                <p className="mt-1 text-xs text-gray-500">Se convertirá a Blocks de Strapi al guardar.</p>
                                <div className="mt-6 grid grid-cols-1 gap-6">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">imágenes existentes</p>
                                        {(!product.media || product.media.length === 0) ? (
                                            <span className="text-xs text-gray-500">No hay imágenes asociadas</span>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {(product.media ?? []).map((m) => {
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
                                                                    onChange={() => setKeptMediaIds(prev => checked ? prev.filter(v => v !== idStr) : [...prev, idStr])}
                                                                />
                                                                mantener
                                                            </label>
                                                            {checked && (
                                                              <button
                                                                type="button"
                                                                onClick={() => setPrimaryId(idStr)}
                                                                className="absolute top-1 left-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded shadow text-gray-900"
                                                              >
                                                                {primaryId === idStr ? 'principal' : 'hacer principal'}
                                                              </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {product.media && product.media.length > 0 && (
                                            (() => {
                                                const removed = (product.media ?? []).filter(m => !keptMediaIds.includes(String(m.id)));
                                                if (removed.length === 0) return null;
                                                return (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-medium text-red-700">se eliminarán:</p>
                                                        <div className="mt-1 grid grid-cols-3 md:grid-cols-6 gap-2">
                                                            {removed.map((m) => (
                                                                <Image key={m.id} src={`${env.strapiUrl}${m.url}`} alt={m.name} width={120} height={80} className="h-16 w-full object-cover rounded" unoptimized />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">agregar nuevas imágenes</p>
                                        <div
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                await handleAddFiles(Array.from(e.dataTransfer.files ?? []));
                                            }}
                                            onClick={() => filePickerRef.current?.click()}
                                            className="mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 hover:bg-gray-100 transition cursor-pointer p-6 text-center"
                                        >
                                            <UploadCloud className="h-8 w-8 text-gray-500" />
                                            <p className="mt-2 text-sm text-gray-700">Drag and Drop</p>
                                            <p className="text-xs text-gray-500">or</p>
                                            <span className="mt-2 inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white">Browse file</span>
                                            <input
                                                ref={filePickerRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    await handleAddFiles(Array.from(e.currentTarget.files ?? []));
                                                    if (e.currentTarget) e.currentTarget.value = '';
                                                }}
                                            />
                                        </div>
                                        {uploaderError && (
                                            <p className="mt-2 text-xs text-red-600">{uploaderError}</p>
                                        )}
                                        {newFiles.length > 0 && (
                                            <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                                                {newFiles.map((f, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <Image src={URL.createObjectURL(f)} alt={f.name} width={160} height={120} className="h-20 w-full object-cover rounded" unoptimized />
                                                        <button type="button" onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 rounded bg-white/90 px-1 text-xs text-gray-800 shadow">quitar</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">Seleccioná una o varias imágenes. Se suben primero y luego se asocian al producto.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" disabled={isSaving || Boolean(uploaderError)} className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm disabled:opacity-60">
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </header>
                </div>
        </main>
    );
}
