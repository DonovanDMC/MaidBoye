import Util from "./Util.js";
import Config from "../config/index.js";
import type { StatCreationData, StatProperties } from "../db/Models/Stat.js";
import Stat, { StatType } from "../db/Models/Stat.js";
import db from "../db/index.js";
import shortUUID from "short-uuid";
import { ApplicationCommandTypes, GatewayOPCodes, InteractionTypes } from "oceanic.js";
import assert from "node:assert";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";

export default class StatsHandler {
    private static pendingDB: Array<StatCreationData> = [];
    private static pendingRedis: Array<string> = [];
    static SessionID = randomUUID();
    static ShortSessionID = shortUUID().fromUUID(this.SessionID);

    static async processPending() {
        if (!db.ready) {
            return false;
        }
        if (this.pendingRedis.length !== 0) {
            const m = db.redis.multi();
            for (const stat of this.pendingRedis) {
                m.incr(stat);
            }
            await m.exec();
            this.pendingRedis = [];
        }
        if (this.pendingDB.length !== 0) {
            for (const stat of this.pendingDB) {
                await Stat.create(stat);
            }
            this.pendingDB = [];
        }

        return true;
    }

    static track<K extends keyof StatProperties>(type: K, ...args: [...args: StatProperties[K], tags?: Array<string>]) {
        const props = {} as StatCreationData;
        const rstats: Array<string> = [];
        switch (type) {
            case "GATEWAY_RECIEVE": {
                assert(Util.is<StatProperties["GATEWAY_RECIEVE"]>(args));
                props.payload = args[0];
                props.event   = args[1];
                rstats.push("stats:gateway", `stats:gateway:${args[0]}`, `stats:session-${this.ShortSessionID}:gateway:${args[0]}`);
                if (args[0] === GatewayOPCodes.DISPATCH && args[1]) {
                    rstats.push(`stats:events:${args[1]}`, `stats:session-${this.ShortSessionID}:events:${args[1]}`);
                }
                break;
            }

            case "REST": {
                assert(Util.is<StatProperties["REST"]>(args));
                props.status_code    = args[0];
                props.status_message = args[1];
                break;
            }

            case "FAILED_RESTRICTION": {
                assert(Util.is<StatProperties["FAILED_RESTRICTION"]>(args));
                rstats.push(`stats:restrictionFail:${args[0]}`, `stats:session-${this.ShortSessionID}:restrictionFail:${args[0]}`);
                break;
            }

            case "INTERACTION": {
                assert(Util.is<StatProperties["INTERACTION"]>(args));
                props.interaction_type      = args[0];
                props.interaction_type_name = InteractionTypes[args[0]];
                rstats.push(`stats:interactions:${InteractionTypes[args[0]]}`, `stats:session-${this.ShortSessionID}:interactions:${InteractionTypes[args[0]]}`);
                if (args[0] === InteractionTypes.APPLICATION_COMMAND && args[1]) {
                    props.application_command_type      = args[1];
                    props.application_command_type_name = ApplicationCommandTypes[args[1]];
                    rstats.push(`stats:interactions:${InteractionTypes[args[0]]}:${ApplicationCommandTypes[args[1]]}`, `stats:session-${this.ShortSessionID}:interactions:${InteractionTypes[args[0]]}:${ApplicationCommandTypes[args[1]]}`);
                }
                break;
            }

            case "READY": {
                rstats.push("stats:ready", `stats:session-${this.ShortSessionID}:ready`);
                break;
            }

            case "SHARD_READY":
            case "SHARD_DISCONNECT":
            case "SHARD_RESUME": {
                assert(Util.is<StatProperties["SHARD_READY" | "SHARD_DISCONNECT" | "SHARD_RESUME"]>(args));
                props.shard_id = args[0];
                if (type === "SHARD_DISCONNECT") {
                    props.close_code = args[1];
                }
                break;
            }

            case "SAUCE_SUCCESS": {
                assert(Util.is<StatProperties["SAUCE_SUCCESS"]>(args));
                props.sauce_simularity = args[0];
                props.sauce_method     = args[1];
                rstats.push("stats:sauceSuccess", `stats:sauceSuccess:${args[1]}`, `stats:session-${this.ShortSessionID}:sauceSuccess`, `stats:session-${this.ShortSessionID}:sauceSuccess:${args[1]}`);
                break;
            }

            case "SAUCE_FAIL":
            case "SAUCE_RATELIMITED": {
                assert(Util.is<StatProperties["SAUCE_FAIL" | "SAUCE_RATELIMITED"]>(args));
                props.sauce_simularity = args[0];
                props.sauce_attempted  = args[1];
                rstats.push(`stats:sauce${type === "SAUCE_FAIL" ? "Fail" : "Ratelimited"}`, `stats:session-${this.ShortSessionID}:sauce${type === "SAUCE_FAIL" ? "Fail" : "Ratelimited"}`);
                break;
            }
        }
        let tags: Array<string> = [];
        if (Array.isArray(args.at(-1))) {
            tags = args.at(-1) as Array<string>;
        }
        tags.push(`env:${Config.isDevelopment ? "development" : "production"}`, `env:${Config.isDocker ? "docker" : "other"}`, `host:${hostname()}`);
        props.type = StatType[type];
        void Stat.create(props);
        if (db.ready) {
            const p = new Promise((resolve, reject) => {
                void Stat.create(props).then(() => {
                    const m = db.redis.multi();
                    for (const stat of rstats) {
                        m.incr(stat);
                    }
                    void m.exec((err, res) => {
                        if (err) {
                            this.pendingRedis.push(...rstats);
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    });
                })
                    .catch(err => {
                        this.pendingDB.push(props);
                        this.pendingRedis.push(...rstats);
                        reject(err);
                    });
            });

            return {
                promise() {
                    return p;
                }
            };
        } else {
            this.pendingDB.push(props);
            this.pendingRedis.push(...rstats);
            return {
                promise() {
                    return Promise.resolve();
                }
            };
        }
    }
}
