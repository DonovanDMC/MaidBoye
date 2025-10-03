import Config from "../../../config/index.js";
import type MaidBoye from "../../../main.js";
import Util from "../../../util/Util.js";
import Command, { type CommandInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { UserCommand } from "../../../util/cmd/OtherCommand.js";
import { ApplicationCommandOptionTypes, type User } from "oceanic.js";

async function handle(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD>, user: User): Promise<void> {
    if (user.banner === null) {
        user = await this.rest.users.get(user.id);
    }

    const member = interaction.guild.members.get(user.id);
    const target = member ?? user;

    const badges = Util.formatBadges(user);
    const flags = member === undefined ? "" : Util.formatFlags(member);

    // this is legacy code but more importantly, IT WORKS
    //                                                              I don't know where joined_at would be null
    const m = Array.from(interaction.guild.members.values()).sort((a, b) => (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0)).map(v => v.id);
    // eslint-disable-next-line no-inner-declarations
    function workItOut(n: boolean, amount = 2) {
        amount++;
        const k: Array<string> = [];
        for (let i = 1; i < amount; i++) {
            const d = n ? m.indexOf(target.id) - i : m.indexOf(target.id) + i;
            if (d < 0 || d > (m.length - 1)) {
                continue;
            } else {
                k.push(m[d]);
            }
        }
        return k;
    }

    let one = workItOut(true).reverse();
    let two = workItOut(false);
    if (one.length === 0) {
        two = workItOut(false, 4);
    } else if (one.length === 1) {
        two = workItOut(false, 3);
    } else if (two.length === 0) {
        one = workItOut(false, 4);
    } else if (two.length === 1) {
        one = workItOut(false, 3);
    }
    const around = [...one, user.id, ...two];

    return interaction.reply(Util.replaceContent({
        embeds: Util.makeEmbed(true, interaction.user)
            .setTitle(`User Info: ${user.tag}`)
            .setThumbnail(user.avatarURL())
            .setDescription(
                "**General User**:",
                `${Config.emojis.default.dot} Tag: **${user.tag}**`,
                `${Config.emojis.default.dot} ID: **${user.id}**`,
                `${Config.emojis.default.dot} Global Avatar: ${user.avatar ? `[[Link](${user.avatarURL()})]` : "[None]"}`,
                `${Config.emojis.default.dot} Banner: ${user.banner ? `[[Link](${user.bannerURL()})]` : "[None]"}`,
                `${Config.emojis.default.dot} Creation Date: ${Util.formatDiscordTime(user.createdAt, "long-datetime", true)}`,
                member === undefined ? "" : [
                    "",
                    "**Server Member**:",
                    `${Config.emojis.default.dot} Server Avatar: ${member.avatar ? `[[Link](${member.avatarURL()})]` : "[None]"}`,
                    `${Config.emojis.default.dot} Join Date: ${member.joinedAt === null ? "Unknown" : Util.formatDiscordTime(member.joinedAt, "long-datetime", true)}`,
                    `${Config.emojis.default.dot} Roles: ${member.roles.length === 0 ? "**None**" : (member.roles.reduce((a,b) => a + b.length + 4 /* <@&> */, 0) > 1500 ? "**Unable To Display Roles.**" : member.roles.map(r => `<@&${r}>`).join(" "))}`,
                    `${Config.emojis.default.dot} Join Info:`,
                    ...around.map(a => `${a === target.id ? `- **[#${m.indexOf(a) + 1}]**` : `- [#${m.indexOf(a) + 1}]`} <@!${a}> (${Util.formatDiscordTime(interaction.guild.members.get(a)!.joinedAt, "short-datetime", true)})`)
                ],
                "",
                "**Badges**:",
                badges === "" ? `${Config.emojis.default.dot} **None**` : badges,
                "",
                "**Flags**:",
                flags === "" ? `${Config.emojis.default.dot} **None**` : flags
            )
            .toJSON(true)
    }));
}

export default new Command(import.meta.url, "uinfo")
    .setDescription("Get information about a user")
    .setCooldown(3e3)
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to get info about (none for yourself)")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUser("user")
    }))
    .setExecutor(async function(interaction, { user }) {
        await handle.call(this, interaction, user ?? interaction.user);
    });

export const userCommand = new UserCommand(import.meta.url, "User Info")
    .setValidLocation(ValidLocation.GUILD)
    .setExecutor(async function(interaction) {
        return handle.call(this, interaction, interaction.data.target as User);
    });
