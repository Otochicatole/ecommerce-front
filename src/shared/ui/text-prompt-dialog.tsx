'use client';
import { ReactNode, useEffect, useState } from 'react';

interface TextPromptDialogProps {
  open: boolean;
  title?: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  contentBelow?: ReactNode;
}

export function TextPromptDialog({ open, title = 'crear', label, placeholder, initialValue = '', description, confirmText = 'Confirmar', cancelText = 'Cancelar', validate, onConfirm, onCancel, loading = false, contentBelow }: TextPromptDialogProps) {
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
    }
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" onClick={onCancel} />
      <div className="relative z-10 w-[92%] max-w-3xl rounded-xl bg-white p-4 shadow-xl">
        {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
        {description && <div className="mt-2 text-lg text-gray-700">{description}</div>}
        <div className="mt-3">
          <label className="block text-lg font-medium text-gray-700">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder={placeholder}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        {contentBelow && (
          <div className="mt-4 max-h-56 overflow-auto border border-gray-200 rounded-md">
            {contentBelow}
          </div>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" className="px-3 py-1.5 text-lg cursor-pointer rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50" onClick={onCancel} disabled={loading}> {cancelText} </button>
          <button
            type="button"
            className="px-3 py-1.5 text-lg rounded-md bg-gray-900 cursor-pointer text-white hover:bg-gray-800 disabled:opacity-60"
            onClick={async () => {
              const message = validate?.(value) ?? null;
              if (message) {
                setError(message);
                return;
              }
              await onConfirm(value.trim());
            }}
            disabled={loading}
          >
            {loading ? 'Guardando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


