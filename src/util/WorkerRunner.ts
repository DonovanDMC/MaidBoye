import type { EmptyService } from "./Service";
import tsNode from "ts-node";
import type { ModuleImport } from "@uwu-codes/types";
import { workerData } from "node:worker_threads";
if (import.meta.url.endsWith(".ts")) {
    tsNode.register({
        esm:           true,
        transpileOnly: true
    });
}
const data = workerData as { name: string; path: string; };
let service = await import(data.path) as ModuleImport<typeof EmptyService> | typeof EmptyService;
if ("default" in service) {
    service = service.default;
}
new service(data.path, data.name);
