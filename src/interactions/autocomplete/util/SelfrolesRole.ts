import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import GuildConfig from "../../../db/Models/GuildConfig.js";
import { assert } from "tsafe";

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
            if (!interaction.guild.roles.get(r)) gConfig.selfroles.splice(gConfig.selfroles.indexOf(r), 1);
        }
        if (gConfig.selfroles.length !== o) await gConfig.edit({ selfroles: gConfig.selfroles });
        switch (type) {
            case "join": {
                const joinable = gConfig.selfroles.filter(r => !interaction.member.roles.includes(r)).map(r => interaction.guild.roles.get(r)!);

                return interaction.result(joinable.map(r => ({
                    name:  r.name,
                    value: r.id
                })));
            }

            case "leave": {
                const current = gConfig.selfroles.filter(r => interaction.member.roles.includes(r)).map(r => interaction.guild.roles.get(r)!);

                return interaction.result(current.map(r => ({
                    name:  r.name,
                    value: r.id
                })));
            }

            case "remove": {
                if (!interaction.member.permissions.has("MANAGE_ROLES")) return interaction.result([]);

                const roles = gConfig.selfroles.map(r => interaction.guild.roles.get(r)!);
                return interaction.result(roles.map(r => ({
                    name:  r.name,
                    value: r.id
                })));

            }
        }
    }
}
