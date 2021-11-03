import type MaidBoye from "@MaidBoye";
import type Eris from "eris";

export default class ClientEvent<K extends keyof Eris.ClientEvents = keyof Eris.ClientEvents> {
	name: K;
	listener: (this: MaidBoye, ...args: Eris.ClientEvents[K]) => void;
	constructor(event: K, listener: (this: MaidBoye, ...args: Eris.ClientEvents[K]) => void) {
		this.name = event;
		this.listener = listener;
	}
}
