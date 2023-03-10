import type MaidBoye from "../main.js";

let client: MaidBoye;

export function setClient(c: MaidBoye) {
    client = c;
}

export function getClient() {
    return client;
}
