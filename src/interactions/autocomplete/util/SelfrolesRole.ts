import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import assert from "node:assert";

export default class SelfrolesRoleAutocomplete extends BaseAutocomplete {
    command = "selfroles";
    option = "role";

    // we're just letting Discord handle no-option results
    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const [type] = interaction.data.options.getSubCommand<["join" | "leave" | "remove"]>(true);
        const gConfig = await GuildConfig.get(interaction.guildID);
        const o = gConfig.selfroles.length;
        for (const r of gConfig.selfroles) {
            if (!interaction.guild.roles.get(r)) {
                gConfig.selfroles.splice(gConfig.selfroles.indexOf(r), 1);
            }
        }
        if (gConfig.selfroles.length !== o) {
            await gConfig.edit({ selfroles: gConfig.selfroles });
        }
        switch (type) {
            case "join": {
                let joinable = gConfig.selfroles.filter(r => !interaction.member.roles.includes(r)).map(r => interaction.guild.roles.get(r)!).map(r => ({
                    name:  r.name,
                    value: r.id
                }));

                if (joinable.length > 25) {
                    const more = joinable.length - 24;
                    joinable = joinable.slice(0, 24);
                    joinable.push({
                        name:  `(and ${more} more)`,
                        value: "0"
                    });
                }
                return interaction.reply(joinable);
            }

            case "leave": {
                let current = gConfig.selfroles.filter(r => interaction.member.roles.includes(r)).map(r => interaction.guild.roles.get(r)!).map(r => ({
                    name:  r.name,
                    value: r.id
                }));
                if (current.length > 25) {
                    const more = current.length - 24;
                    current = current.slice(0, 24);
                    current.push({
                        name:  `(and ${more} more)`,
                        value: "0"
                    });
                }

                return interaction.reply(current);
            }

            case "remove": {
                if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                    return interaction.reply([]);
                }

                let roles = gConfig.selfroles.map(r => interaction.guild.roles.get(r)!).map(r => ({
                    name:  r.name,
                    value: r.id
                }));
                if (roles.length > 25) {
                    const more = roles.length - 24;
                    roles = roles.slice(0, 24);
                    roles.push({
                        name:  `(and ${more} more)`,
                        value: "0"
                    });
                }
                return interaction.reply(roles);

            }
        }
    }
}
