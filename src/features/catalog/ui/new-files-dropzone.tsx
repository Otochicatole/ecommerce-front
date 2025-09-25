'use client';
import Image from "next/image";
import { UploadCloud } from "lucide-react";

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
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                    e.preventDefault();
                    await onAddFiles(Array.from(e.dataTransfer.files ?? []));
                }}
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 hover:bg-gray-100 transition cursor-pointer p-6 text-center"
            >
                <UploadCloud className="h-8 w-8 text-gray-500" />
                <p className="mt-2 text-sm text-gray-700">Drag and Drop</p>
                <p className="text-xs text-gray-500">or</p>
                <span className="mt-2 inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white">Browse file</span>
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
            {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            {files.length > 0 && (
                <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                    {files.map((f, idx) => (
                        <div key={idx} className="relative group">
                            <Image src={URL.createObjectURL(f)} alt={f.name} width={160} height={120} className="h-20 w-full object-cover rounded" unoptimized />
                            <button type="button" onClick={() => onRemoveAt(idx)} className="absolute top-1 right-1 rounded bg-white/90 px-1 text-xs text-gray-800 shadow">quitar</button>
                        </div>
                    ))}
                </div>
            )}
            <p className="mt-1 text-xs text-gray-500">Seleccioná una o varias imágenes. Se suben primero y luego se asocian al producto.</p>
        </div>
    );
}


