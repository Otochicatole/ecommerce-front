'use client';
import Image from "next/image";
import { Trash2, UploadCloud } from "lucide-react";

interface NewFilesDropzoneProps {
    files: File[];
    onAddFiles: (files: File[]) => Promise<void> | void;
    onRemoveAt: (index: number) => void;
    fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    error?: string | null;
}

export function NewFilesDropzone({ files, onAddFiles, onRemoveAt, fileInputRef, error }: NewFilesDropzoneProps) {
    return (
        <div>
            <div className="border-t border-b py-10 border-black/10 ">
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                        e.preventDefault();
                        await onAddFiles(Array.from(e.dataTransfer.files ?? []));
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex flex-col items-center justify-center max-w-2xl rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 hover:bg-gray-100 transition cursor-pointer p-6 text-center"
                >
                    <UploadCloud className="h-8 w-8 text-gray-500" />
                    <p className="mt-2 text-sm text-gray-700">Arrastra y suelta</p>
                    <p className="text-xs text-gray-500">o</p>
                    <span className="mt-2 inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white">Explorar archivos</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            await onAddFiles(Array.from(e.currentTarget.files ?? []));
                            if (e.currentTarget) e.currentTarget.value = '';
                        }}
                    />
                </div>
            </div>
            {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            {files.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {files.map((f, idx) => (
                        <div key={idx} className="relative group max-w-100">
                            <Image src={URL.createObjectURL(f)} alt={f.name} width={160} height={120} className="h-20 w-full object-cover rounded" unoptimized />
                            <button type="button" onClick={() => onRemoveAt(idx)}
                                className="absolute top-1 right-1 rounded-full p-2 min-w-10 min-h-10 hover:text-red-600 cursor-pointer flex items-center justify-center bg-white/90 px-1 text-xs text-gray-800 shadow">
                                <Trash2 />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <p className="mt-1 text-sm text-gray-500">Seleccioná una o varias imágenes. Se suben primero y luego se asocian al producto.</p>
        </div>
    );
}


