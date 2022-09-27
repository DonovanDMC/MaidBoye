export interface FailResponse<C extends number = 400> {
    code: C;
    message: string;
    success: false;
}

export interface ImageFormatSquare {
    color: string;
    height: number;
    round?: number;
    type: "bitmap";
    width: number;
    x: number;
    y: number;
}

export 	interface ImageFormatURL {
    height?: number;
    round?: number;
    type: "url";
    url: string;
    width?: number;
    x: number;
    y: number;
}

export interface ImageFormatCircle {
    color: string;
    radius: number;
    type: "circle";
    x: number;
    y: number;
}

export interface ImageFormatTriangle {
    color: string;
    cut: "topleft" | "topright" | "bottomleft" | "bottomright";
    height: number;
    type: "triangle";
    width: number;
    x: number;
    y: number;
}

export type AnyImageFormat = ImageFormatSquare | ImageFormatURL | ImageFormatCircle | ImageFormatTriangle;

export interface TextFormat {
    bold?: boolean;
    color: string;
    font?: string;
    outline?: number;
    outlinecolor?: string;
    text: string;
    type: number;
    unicode?: boolean;
    x: number;
    y: number;
}
