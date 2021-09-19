import Route from "../Route";
import * as fs from "fs-extra";
import { bulkDeleteDir } from "@config";

export default class LinksRoute extends Route {
	constructor() {
		super("/bulk-delete");

		this.app
			.get("/:id", async(req,res) => {
				if (fs.existsSync(`${bulkDeleteDir}/${req.params.id}`)) return res.status(200).header("Content-Type", "text/plain").sendFile(`${bulkDeleteDir}/${req.params.id}`);
				else return res.status(404).end("Unknown Report.");
			});
	}
}
