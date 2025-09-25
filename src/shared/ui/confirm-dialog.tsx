'use client';
import { ReactNode } from "react";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    description?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function ConfirmDialog({ open, title = 'confirmar', description, confirmText = 'confirmar', cancelText = 'cancelar', onConfirm, onCancel, loading = false }: ConfirmDialogProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative z-10 w-[92%] max-w-sm rounded-xl bg-white p-4 shadow-xl">
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                {description && (
                    <div className="mt-2 text-xs text-gray-700">{description}</div>
                )}
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'eliminando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}


