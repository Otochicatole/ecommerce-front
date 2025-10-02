'use client';
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import { useState } from "react";
import type { BlocksContent } from "@strapi/blocks-react-renderer";
import { useRouter } from "next/navigation";
import { getPublicImageUrl } from "@/shared/utils";
import { blocksToPlainText, plainTextToBlocks } from "@/features/catalog/services/product/description";
import { useMediaManager } from "@/features/catalog/services/product/media-manager";
import { MediaGrid } from "@/features/catalog/ui/media-grid";
import { NewFilesDropzone } from "@/features/catalog/ui/new-files-dropzone";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import FullscreenLoader from "@/shared/ui/fullscreen-loader";

interface ProductDetailProps {
    product: Product;
    saveAction?: (formData: FormData) => Promise<unknown>;
    uploadMediaAction?: (formData: FormData) => Promise<{ ids: number[] }>;
    setMediaAction?: (formData: FormData) => Promise<unknown>;
    deleteMediaAction?: (formData: FormData) => Promise<{ deleted: number }>;
    deleteProductAction?: (formData: FormData) => Promise<unknown>;
    sizesOptions?: Array<{ id: number; documentId?: string; size: string }>;
    typeOptions?: Array<{ id: number; documentId?: string; type: string }>;
}

export default function AdmProductDetail({ product, saveAction, uploadMediaAction, setMediaAction, deleteMediaAction, deleteProductAction, sizesOptions = [], typeOptions = [] }: ProductDetailProps) {
    const router = useRouter();
    const { keptMediaIds, setKeptMediaIds, newFiles, addFiles, removeNewFileAt, clearNewFiles, primaryId, setPrimaryId, error: uploaderError, setErrorMessage, filePickerRef } = useMediaManager(
        (product.media ?? []).map(m => String(m.id)),
        (product.media?.[0]?.id ? String(product.media[0].id) : null),
        { maxImageSizeMb: 1 }
    );

    const [name, setName] = useState(product.name ?? "");
    const [price, setPrice] = useState<string>(product.price?.toString() ?? "");
    const [offer, setOffer] = useState<boolean>(Boolean(product.offer));
    const [offerPrice, setOfferPrice] = useState<string>(product.offerPrice?.toString() ?? "");
    const [stock, setStock] = useState<string>(product.stock?.toString() ?? "");
    const [show, setShow] = useState<boolean>(Boolean(product.show));
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const hasDelete = Boolean(deleteProductAction && (product.documentId || product.id));
    const [selectedSizes, setSelectedSizes] = useState<string[]>(() => (product.sizes ?? []).map(s => s.documentId ?? String(s.id)));
    const [selectedTypes, setSelectedTypes] = useState<string[]>(() => (product.type_products ?? []).map(t => t.documentId ?? String(t.id)));
    function toggleValue(list: string[], value: string): string[] {
        return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
    }
    const [descriptionText, setDescriptionText] = useState<string>(() => {
        return product.description ? blocksToPlainText(product.description as BlocksContent) : "";
    });

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
                const saveRes = await saveAction(fd);

                // media flow: upload then set association (only if we have a valid id/documentId)
                const fromSave = (typeof saveRes === 'object' && saveRes !== null) ? (saveRes as { id?: number; documentId?: string }) : undefined;
                const idForMedia = (
                    (fromSave?.documentId ?? (fromSave?.id != null ? String(fromSave.id) : ''))
                    || product.documentId
                    || (product.id ? String(product.id) : '')
                );
                if ((uploadMediaAction || setMediaAction) && idForMedia && (newFiles.length > 0 || keptMediaIds.length > 0)) {
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
                                setErrorMessage(`no se pudo subir la imagen: ${file.name}. detalle: ${msg}`);
                                return; // abort submit on first failed upload
                            }
                        }
                    }
                    if (setMediaAction) {
                        const assoc = new FormData();
                        assoc.set('id', String(idForMedia));
                        const base = [...keptMediaIds.map(Number), ...newIds];
                        if (base.length === 0) {
                            // nothing to associate, continue
                        } else {
                            const chosenPrimary = (primaryId && base.includes(Number(primaryId))) ? Number(primaryId) : base[0];
                            const rest = base.filter(id => id !== chosenPrimary);
                            const finalIds = [chosenPrimary, ...rest];
                            finalIds.forEach((id, i) => assoc.append(`media[${i}]`, String(id)));
                            await setMediaAction(assoc);
                            // reflect changes locally so nuevas imágenes no aparezcan como "a eliminar"
                            setKeptMediaIds(() => finalIds.map(String));
                            clearNewFiles();
                            setPrimaryId(String(finalIds[0] ?? ''));
                        }
                    }
                }
                // navigate after create
                const wasCreate = !(product.documentId || product.id);
                const newDocId = fromSave?.documentId;
                if (wasCreate && newDocId) {
                    router.push(`/admin/edit/product/${newDocId}`);
                    return;
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

    async function handleDeleteConfirm() {
        if (!deleteProductAction) {
            setConfirmOpen(false);
            return;
        }
        try {
            setIsDeleting(true);
            const fd = new FormData();
            fd.set('id', product.documentId ?? String(product.id ?? ''));
            await deleteProductAction(fd);
            setConfirmOpen(false);
            router.push('/admin/stock');
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    }

    function RelationsSelector() {
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-lg font-medium text-gray-700">Talles Disponibles</label>
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
                                        className="w-6 h-6 accent-gray-900 rounded cursor-pointer"
                                    />
                                    <span className="select-none">{s.size}</span>
                                </label>
                            );
                        })}
                        {sizesOptions.length === 0 && (
                            <span className="text-xs text-gray-500">No hay tamaños disponibles</span>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-lg font-medium text-gray-700">Categorias a la que pertenece</label>
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
                                        className="w-6 h-6 accent-gray-900 rounded cursor-pointer"
                                    />
                                    <span className="select-none">{t.type}</span>
                                </label>
                            );
                        })}
                        {typeOptions.length === 0 && (
                            <span className="text-xs text-gray-500">No hay categorias disponibles</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    function MediaManagerPanel() {
        return (
            <div className="md:col-span-3">
                <label className="block text-lg font-medium text-gray-700">Descripción del producto</label>
                <textarea
                    value={descriptionText}
                    onChange={(e) => setDescriptionText(e.target.value)}
                    className="mt-1 w-full min-h-[240px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                    spellCheck={false}
                />
                <div className="mt-6 grid grid-cols-1 gap-6">
                    <div>
                        <p className="text-lg font-medium text-gray-700 mb-2 pb-2 border-b border-gray-200">Imágenes existentes</p>
                        {(!product.media || product.media.length === 0) ? (
                            <span className="text-xs text-gray-500">No hay imágenes asociadas</span>
                        ) : (
                            <MediaGrid
                                items={(product.media ?? []).map(m => ({ id: m.id, url: m.url, name: m.name }))}
                                keptMediaIds={keptMediaIds}
                                onToggleKeep={(id) => setKeptMediaIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])}
                                primaryId={primaryId}
                                onSetPrimary={(id) => setPrimaryId(id)}
                            />
                        )}
                        {product.media && product.media.length > 0 && (
                            (() => {
                                const removed = (product.media ?? []).filter(m => !keptMediaIds.includes(String(m.id)));
                                if (removed.length === 0) return null;
                                return (
                                    <div className="mt-3 border border-red-500 p-3 rounded-md">
                                        <p className="text-lg font-medium text-red-700">Se eliminarán:</p>
                                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                            {removed.map((m) => (
                                                <div key={m.id} className="max-w-100">
                                                    <Image src={getPublicImageUrl(m.url)}
                                                        alt={m.name}
                                                        width={120}
                                                        height={80}
                                                        className="w-full object-cover rounded" unoptimized />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">Agregar nuevas imágenes</p>
                        <NewFilesDropzone
                            files={newFiles}
                            onAddFiles={addFiles}
                            onRemoveAt={removeNewFileAt}
                            fileInputRef={filePickerRef}
                            error={uploaderError}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="flex flex-col items-center p-5 min-h-screen overflow-y-auto">
            <div className="flex flex-col h-full min-h-[90vh] p-2 w-full gap-6">
                <header className="flex border border-black/20 flex-col w-full p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1 md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Nombre del producto</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                            />
                        </div>
                        {RelationsSelector()}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Precio del producto</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Precio de la oferta</label>
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
                            <label className="block text-sm font-medium text-gray-700">Stock</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={show} onChange={() => setShow(v => !v)} className="sr-only peer" />
                                <div className="group peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-300 w-16 h-8 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-['✖️'] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-6 after:w-6 after:top-1 after:left-1 after:-rotate-180 after:flex after:justify-center after:items-center peer-checked:after:translate-x-8 peer-checked:after:content-['✔️'] peer-hover:after:scale-95 peer-checked:after:rotate-0"></div>
                            </label>
                            <label className="text-sm font-medium text-gray-700">Mostrar en el catálogo</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={offer} onChange={() => setOffer(v => !v)} className="sr-only peer" />
                                <div className="group peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-300 w-16 h-8 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-['✖️'] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-6 after:w-6 after:top-1 after:left-1 after:-rotate-180 after:flex after:justify-center after:items-center peer-checked:after:translate-x-8 peer-checked:after:content-['✔️'] peer-hover:after:scale-95 peer-checked:after:rotate-0"></div>
                            </label>
                            <label className="text-sm font-medium text-gray-700">Oferta</label>
                        </div>
                        {MediaManagerPanel()}
                        <div className={`md:col-span-3 flex ${hasDelete ? 'justify-between' : 'justify-end'}`}>
                            {hasDelete && (
                                <button type="button" onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-60">
                                    Eliminar producto
                                </button>
                            )}
                            <button type="submit" disabled={isSaving || Boolean(uploaderError)} className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm disabled:opacity-60">
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </header>
                <FullscreenLoader open={isSaving} label="LOADING" />
                {hasDelete && (
                    <ConfirmDialog
                        open={confirmOpen}
                        title="Eliminar producto"
                        description={<span>Vas a eliminar <b>{name || product.name}</b>. esta acción no se puede deshacer.</span>}
                        confirmText="Eliminar"
                        cancelText="Cancelar"
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => setConfirmOpen(false)}
                        loading={isDeleting}
                    />
                )}
            </div>
        </main>
    );
}
