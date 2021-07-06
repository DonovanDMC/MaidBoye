const e = process.argv[2];
if (!e) throw new Error("Nothing provided.");
let str = "";
e.split("").forEach(v => str += `\\u${v.charCodeAt(0).toString(16)}`);
// eslint-disable-next-line no-eval
console.log("Provided:", eval(`"${str}"`), "\nUnicode:", str);
