export type Writeable<T extends Record<string, unknown>> = {
    [P in keyof T]: T[P];
};

export interface EditSnipe {
    author: string;
    newContent: string;
    oldContent: string;
    time: number;
}

export interface Snipe {
    author: string;
    content: string;
    ref: null | Record<"author" | "content" | "link", string>;
    time: number;
}

export interface BulkDeleteReport {
    channel: [id: string, name: string];
    createdAt: number;
    expiresAt: number;
    guild: [id: string, name: string];
    messageCount: number;
    messages: Array<{
        author: string;
        content: string | null;
        timestamp: number;
    }>;
}
