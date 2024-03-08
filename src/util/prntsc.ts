import Logger from "@uwu-codes/logger";
import { JSDOM } from "jsdom";

const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
export async function getRandomCode(length = 6) {
    const randomChars: Array<string> = [];

    for (let index = 0; index < length; index += 1) {
        const charID = Math.round(Math.random() * chars.length + 1);
        randomChars.push(chars[charID]);
    }

    return randomChars.join("");
}
export async function prntsc(): Promise<{ image: string; link: string; }> {
    const code = await getRandomCode();

    const body = await fetch(`https://prnt.sc/${code}`).then(r => r.text()).then(r => new JSDOM(r));
    let image = body.window.document.querySelector("img#screenshot-image")?.getAttribute("src");

    const removed = ["//st.prntscr.com/2023/07/24/0635/img/0_173a7b_211be8ff.png"];

    let valid = false;
    if (image && !removed.includes(image)) {
        if (image.startsWith("//st.prntscr.com")) {
            image = `https:${image}`;
        }
        const status = await fetch(image, { method: "HEAD", redirect: "manual" });
        valid = status.headers.get("location") === "https://i.imgur.com/removed.png" ? false : status.status === 200;
    }

    if (!image || !valid) {
        Logger.getLogger("Prntsc").warn(`Invalid image (${image}), retrying...`);
        return prntsc();
    }

    return {
        link: `https://prnt.sc/${code}`,
        image
    };
}
