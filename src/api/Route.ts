import { Router } from "express";

export default class Route {
	app: Router;
	path: string;
	constructor(path: string) {
		this.path = path;
		this.app = Router();
	}

	get checkout() { return this.app.checkout.bind(this.app); }
	get copy() { return this.app.copy.bind(this.app); }
	get delete() { return this.app.delete.bind(this.app); }
	get get() { return this.app.get.bind(this.app); }
	get head() { return this.app.head.bind(this.app); }
	get lock() { return this.app.lock.bind(this.app); }
	get merge() { return this.app.merge.bind(this.app); }
	get mkactivity() { return this.app.mkactivity.bind(this.app); }
	get mkcol() { return this.app.mkcol.bind(this.app); }
	get move() { return this.app.move.bind(this.app); }
	get ["m-search"]() { return this.app["m-search"].bind(this.app); }
	get notify() { return this.app.notify.bind(this.app); }
	get options() { return this.app.options.bind(this.app); }
	get patch() { return this.app.patch.bind(this.app); }
	get post() { return this.app.post.bind(this.app); }
	get purge() { return this.app.purge.bind(this.app); }
	get put() { return this.app.put.bind(this.app); }
	get report() { return this.app.report.bind(this.app); }
	get search() { return this.app.search.bind(this.app); }
	get subscribe() { return this.app.subscribe.bind(this.app); }
	get trace() { return this.app.trace.bind(this.app); }
	get unlock() { return this.app.unlock.bind(this.app); }
	get unsubscribe() { return this.app.unsubscribe.bind(this.app); }
}
