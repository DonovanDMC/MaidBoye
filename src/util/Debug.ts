import debug from "debug";

export default function Debug(name: string, first: unknown, ...extra: Array<unknown>) {
    return debug(!name ? "maidboye:general" : `maidboye:${name}`)(first, ...extra);
}
