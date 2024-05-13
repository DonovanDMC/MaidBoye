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

export type AllowSymbol<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] | symbol;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractConstructorArg<T> = T extends new (arg1: infer U) => any ? U : never;
