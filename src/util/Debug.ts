import debug from "debug";

export default function Debug(name: string, first: unknown, ...extra: Array<unknown>) {
    return debug(name ? `maidboye:${name}` : "maidboye:general")(first, ...extra);
}
