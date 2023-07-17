import type MaidBoye from "../main.js";
import type { AnyGuildInteraction, AnyPrivateInteraction, ClientEvents } from "oceanic.js";

export default class ClientEvent<K extends keyof ClientEvents = keyof ClientEvents> {
    listener: (this: MaidBoye, ...args: ClientEvents[K]) => void;
    name: K;
    constructor(event: "interactionCreate", listener: (this: MaidBoye, ...args: [interaction: AnyGuildInteraction | AnyPrivateInteraction]) => void);
    constructor(event: K, listener: (this: MaidBoye, ...args: ClientEvents[K]) => void);
    constructor(event: K, listener: (this: MaidBoye, ...args: ClientEvents[K]) => void) {
        this.name = event;
        this.listener = listener;
    }
}
