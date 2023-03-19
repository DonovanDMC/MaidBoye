import type { EmptyService } from "./Service";
import type { ModuleImport } from "@uwu-codes/types";
import { workerData } from "node:worker_threads";
if (import.meta.url.endsWith(".ts")) {
    const { register } = await import("ts-node");
    register({
        esm: true,
        swc: true
    });
}
const data = workerData as { name: string; path: string; };
let service = await import(data.path) as ModuleImport<typeof EmptyService> | typeof EmptyService;
if ("default" in service) {
    service = service.default;
}
new service(data.path, data.name);
