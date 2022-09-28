import { Timer, Utility } from "@uwu-codes/utils";
import IORedis from "ioredis";
const r = new IORedis({
    host: "172.19.3.4"
});

function getID() {
    let str = "";
    for (let i = 0; i < 18; i++) str += Math.floor(Math.random() * 10);
    return str;
}

const start = Timer.getTime();
const total = await Utility.getKeys(r, "*");
let added = 0;
for (let i = 0; i < 100; i++) {
    const g = getID();
    for (let ii = 0; ii < 250; ii++) {
        const num = Math.floor(Math.random() * (150000 - 100) + 100);
        const u = getID();
        await r.set(`leveling:${u}:${g}`, num);
        console.log("%s-> %s (%d / %d)", `leveling:${u}:${g}`, num, ++added, 1600 * 250);
    }
}
const end = Timer.getTime();

console.log("Added %d keys, new total: %d (took: %s)", added, total.length + added, Timer.calc(start, end, 3, false));
process.exit(0);
