'use client';
import Box from "@/shared/ui/box";
import VerticalCarousel from "./vertical-carousel";
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import type { BlocksContent } from "@strapi/blocks-react-renderer";
import { useState } from "react";
import { useRouter } from "next/navigation";
import env from "@/config";

interface ProductDetailProps {
    product: Product;
    saveAction?: (formData: FormData) => Promise<unknown>;
}

export default function AdmProductDetail({ product, saveAction }: ProductDetailProps) {
    const initialImage = product.media?.[0]?.url ? `${env.strapiUrl}${product.media[0].url}` : "/nullimg.webp";
    const [imageViewUrl, setImageViewUrl] = useState(initialImage);
    const router = useRouter();

    const [name, setName] = useState(product.name ?? "");
    const [price, setPrice] = useState<string>(product.price?.toString() ?? "");
    const [offer, setOffer] = useState<boolean>(Boolean(product.offer));
    const [offerPrice, setOfferPrice] = useState<string>(product.offerPrice?.toString() ?? "");
    const [stock, setStock] = useState<string>(product.stock?.toString() ?? "");
    const [show, setShow] = useState<boolean>(Boolean(product.show));
    const [isSaving, setIsSaving] = useState(false);
    const [descriptionText, setDescriptionText] = useState<string>(() => {
        return product.description ? blocksToPlainText(product.description) : "";
    });

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
                await saveAction(fd);
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
            <Box className="min-h-[95vh]">
                <div className="flex flex-col h-full min-h-[90vh] p-2 w-full gap-6">
                    <header className="flex flex-col w-full p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300">
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
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm disabled:opacity-60">
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </header>
                    <article className="flex flex-col w-full">
                        <section className="flex gap-2 flex-row w-full">
                            <VerticalCarousel data={product} setImageViewUrl={setImageViewUrl} />
                            <div className="flex flex-row items-center justify-center w-full overflow-hidden h-[550px] p-6 bg-black/5 rounded-lg shadow-lg border border-black/1">
                                {imageViewUrl ? (
                                    <Image className="object-cover w-fit h-fit rounded-lg" src={imageViewUrl} loading="lazy" alt={product.name || "Imagen del producto"} width={500} height={500} unoptimized />
                                ) : null}
                            </div>
                        </section>
                        <section className="mt-6">
                            <h2 className="text-xl text-black/70 font-semibold mb-2">Descripción</h2>
                            {product?.description ? <BlocksRenderer content={product.description} /> : <p>No description available.</p>}
                        </section>
                    </article>
                </div>
            </Box>
        </main>
    );
}
