import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import CommandHandler from "../../../util/cmd/CommandHandler.js";
import Config from "../../../config/index.js";
import pkg from "../../../../package.json" assert { type: "json" };
import ServicesManager from "../../../util/ServicesManager.js";
import { ComponentBuilder } from "@oceanicjs/builders";
import { Strings, Time } from "@uwu-codes/utils";
import { GATEWAY_VERSION, REST_VERSION, VERSION, type MessageActionRow } from "oceanic.js";
import { parse } from "yaml";
import { freemem, totalmem } from "node:os";
import { memoryUsage, uptime } from "node:process";
import { readFile } from "node:fs/promises";
const lock = parse(await readFile(`${Config.baseDir}/pnpm-lock.yaml`, "utf8")) as { devDependencies: Record<string, { specifier: string; version: string; }>; };

export default new Command(import.meta.url, "info")
    .setDescription("Get some information about me..")
    .setAck("ephemeral-user")
    .setCooldown(3e3)
    .setExecutor(async function(interaction) {
        const usage = await ServicesManager.getMemoryUsage();
        const names: Record<string, string> = {
            "auto-posting":     "Autoposting",
            "furry-bot-status": "FurryBot Status"
        };
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setDescription(
                    "**Stats/General**:",
                    `${Config.emojis.default.dot} System Memory: **${Strings.formatBytes(totalmem() - freemem(), 2)}** / **${Strings.formatBytes(totalmem(), 2)}**`,
                    `${Config.emojis.default.dot} Process Memory: **${Strings.formatBytes(memoryUsage().heapUsed, 2)}** / **${Strings.formatBytes(memoryUsage().heapTotal, 2)}**`,
                    ...Object.entries(usage).map(([k, v]) => `${Config.emojis.default.dot} [Service] ${names[k] ?? k}: **${Strings.formatBytes(v.heapUsed, 2)}** / **${Strings.formatBytes(v.heapTotal, 2)}**`),
                    `${Config.emojis.default.dot} CPU Usage: **${this.cpuUsage}%**`,
                    `${Config.emojis.default.dot} Uptime: ${Time.ms(uptime() * 1000, { seconds: true, ms: false })} (${Time.secondsToHMS(uptime())})`,
                    ...("guild" in interaction && interaction.guild ? [`${Config.emojis.default.dot} Shard: **${interaction.guild.shard.id + 1}**/**${this.shards.size}**`] : []),
                    `${Config.emojis.default.dot} Guilds: **${this.guilds.size}**`,
                    `${Config.emojis.default.dot} Large Guilds: **${this.guilds.filter(g => g.large).length}**`,
                    `${Config.emojis.default.dot} Channels: **${Object.keys(this.channelGuildMap).length}**`,
                    `${Config.emojis.default.dot} Users: **${this.users.size}**`,
                    `${Config.emojis.default.dot} Commands: **${CommandHandler.commands.length}** (**${CommandHandler.categories.length}** categories)`,
                    "",
                    "**Developers**:",
                    `${Config.emojis.default.dot} [Creator] [Donovan_DMC](${Config.devLink})`,
                    "",
                    "**Other**:",
                    `${Config.emojis.default.dot} Library: ${VERSION.includes("-dev") ? `[Oceanic@${VERSION.split(".").at(-1)!}](https://github.com/OceanicJS/Oceanic/tree/${VERSION.split(".").at(-1)!}) (**${VERSION}**, \`${VERSION.split(".").at(-1)!}\`)` : `[Oceanic](https://github.com/OceanicJS/Oceanic/tree/${VERSION}) (**${VERSION}**)`}`,
                    `${Config.emojis.default.dot} API Version: **v${REST_VERSION}**`,
                    `${Config.emojis.default.dot} Gateway Version: **v${GATEWAY_VERSION}**`,
                    `${Config.emojis.default.dot} Version: **${pkg.version}** (Build Date: ${pkg.buildDate === null ? "Unknown" : `${String(pkg.buildDate).slice(0, 2)}/${String(pkg.buildDate).slice(2, 4)}/${String(pkg.buildDate).slice(4, 8)}`})`,
                    `${Config.emojis.default.dot} Node Version: **${process.version}**`,
                    `${Config.emojis.default.dot} Typescript Version: **${lock.devDependencies.typescript.version}**`
                )
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addURLButton({
                    url:   Config.discordLink,
                    label: "Support Server"
                })
                .addURLButton({
                    url:   Config.webLink,
                    label: "Website"
                })
                .addURLButton({
                    url:   Config.privacyPolicyLink,
                    label: "Privacy Policy"
                })
                .addURLButton({
                    url:   Config.devLink,
                    label: "Developer"
                })
                .addURLButton({
                    url:   Config.donationLink,
                    label: "Donate"
                })
                .toJSON()
        });
    });
