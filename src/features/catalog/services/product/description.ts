import type { BlocksContent } from "@strapi/blocks-react-renderer";

// Convert Strapi Blocks to plain text (line-separated)
export function blocksToPlainText(blocks: BlocksContent): string {
    const lines: string[] = [];
    for (const block of blocks) {
        if ((block as { type?: string }).type === "paragraph") {
            const paragraph = block as unknown as {
                type: string;
                children?: Array<{ text?: string }>;
            };
            const text = (paragraph.children ?? [])
                .map((child) => (child?.text ?? ""))
                .join("");
            lines.push(text);
        }
    }
    return lines.join("\n");
}

// Convert plain text (line-separated) to Strapi Blocks
export function plainTextToBlocks(text: string): BlocksContent {
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


