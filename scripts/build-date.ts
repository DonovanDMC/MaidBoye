import pkg from "../package.json";
import * as fs from "fs-extra";

console.log("Current Build Date:", pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`);
const d = new Date();
(pkg.buildDate as string | null) = `${d.getMonth().toString().padStart(2, "0")}${(d.getDate() + 1).toString().padStart(2, "0")}${d.getFullYear()}`;
console.log("New Build Date:", pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`);
fs.writeFileSync(`${__dirname}/../package.json`, JSON.stringify(pkg, undefined, "  "));
