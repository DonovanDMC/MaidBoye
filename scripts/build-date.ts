import pkg from "../package.json" assert { type: "json" };
import { access, writeFile } from "fs/promises";

console.log("Current Build Date:", pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`);
const d = new Date();
(pkg.buildDate as string | null) = `${d.getMonth().toString().padStart(2, "0")}${(d.getDate() + 1).toString().padStart(2, "0")}${d.getFullYear()}`;
console.log("New Build Date:", pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`);
await writeFile(new URL("../package.json", import.meta.url), JSON.stringify(pkg, undefined, "  "));
// if built, write to build dir as well
if (await access(new URL("../build", import.meta.url)).then(() => true, () => false)) await writeFile(new URL("../build/package.json", import.meta.url), JSON.stringify(pkg, undefined, "  "));
