import { useCallback, useMemo, useRef, useState } from "react";
import { compressToUnderSize } from "@/shared/ui/image-compress";

export interface MediaManagerOptions {
    maxImageSizeMb?: number;
}

export interface UseMediaManager {
    keptMediaIds: string[];
    setKeptMediaIds: (updater: (prev: string[]) => string[]) => void;
    newFiles: File[];
    addFiles: (files: File[]) => Promise<void>;
    removeNewFileAt: (index: number) => void;
    clearNewFiles: () => void;
    primaryId: string | null;
    setPrimaryId: (id: string | null) => void;
    error: string | null;
    clearError: () => void;
    setErrorMessage: (message: string | null) => void;
    filePickerRef: React.MutableRefObject<HTMLInputElement | null>;
}

export function useMediaManager(initialKeptIds: string[], initialPrimaryId: string | null, options?: MediaManagerOptions): UseMediaManager {
    const maxImageSizeMb = options?.maxImageSizeMb ?? 1;
    // 1 MiB exacto por MB lógico. Si el caller pasa 1, son 1048576 bytes.
    const maxBytes = Math.floor(1024 * 1024 * (maxImageSizeMb / 1));

    const [keptMediaIds, setKeptMediaIdsState] = useState<string[]>(initialKeptIds);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [primaryId, setPrimaryId] = useState<string | null>(initialPrimaryId);
    const [error, setError] = useState<string | null>(null);
    const filePickerRef = useRef<HTMLInputElement | null>(null);

    const setKeptMediaIds = useCallback((updater: (prev: string[]) => string[]) => {
        setKeptMediaIdsState(updater);
    }, []);

    const clearError = useCallback(() => setError(null), []);
    const setErrorMessage = useCallback((message: string | null) => setError(message), []);

    const addFiles = useCallback(async (files: File[]) => {
        if (!files?.length) return;
        const nonImages = files.filter(f => !(f.type && f.type.startsWith('image/')));
        if (nonImages.length > 0) {
            setError(`solo se permiten imágenes. quitá: ${nonImages.map(f => f.name).join(', ')}`);
            return;
        }
        const processed: File[] = [];
        const failed: string[] = [];
        for (const file of files) {
            if (file.size <= maxBytes) {
                processed.push(file);
                continue;
            }
            try {
                const compressed = await compressToUnderSize(file, { maxBytes });
                if (compressed.size <= maxBytes) {
                    processed.push(compressed);
                } else {
                    failed.push(file.name);
                }
            } catch {
                failed.push(file.name);
            }
        }
        if (failed.length > 0) {
            setError(`estas imágenes exceden ${maxImageSizeMb} MiB, quitá: ${failed.join(', ')}`);
            return;
        }
        setError(null);
        if (processed.length) setNewFiles(prev => [...prev, ...processed]);
    }, [maxBytes, maxImageSizeMb]);

    const removeNewFileAt = useCallback((index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearNewFiles = useCallback(() => setNewFiles([]), []);

    return useMemo(() => ({
        keptMediaIds,
        setKeptMediaIds,
        newFiles,
        addFiles,
        removeNewFileAt,
        clearNewFiles,
        primaryId,
        setPrimaryId,
        error,
        clearError,
        setErrorMessage,
        filePickerRef,
    }), [keptMediaIds, setKeptMediaIds, newFiles, addFiles, removeNewFileAt, clearNewFiles, primaryId, setPrimaryId, error, clearError, setErrorMessage]);
}


