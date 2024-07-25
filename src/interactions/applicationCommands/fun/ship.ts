import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import Logger from "@uwu-codes/logger";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "ship")
    .setDescription("Ship two people")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "first")
            .setDescription("The first user to ship (none for me)")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "second")
            .setDescription("The second user to ship (none for you)")
    )
    .setOptionsParser(interaction => ({
        first:  interaction.data.options.getUser("first", false) || interaction.client.user,
        second: interaction.data.options.getUser("second", false)
    }))
    .setExecutor(async function(interaction, { first, second }) {
        if (second === undefined) {
            second = first;
            first = interaction.user;
        }
        const amount = Number((BigInt(first.id) + BigInt(second.id)) % 100n) + 1;
        const name = first.username.slice(0, Math.floor(Math.random() * 5) + 3) + second.username.slice(-(Math.floor(Math.random() * 5) + 3));
        let image: string;
        if (amount === 100)    {
            image = "100-percent";
        } else if (amount >= 80) {
            image = "80-99-percent";
        } else if (amount >= 60) {
            image = "60-79-percent";
        } else if (amount >= 40) {
            image = "40-59-percent";
        } else if (amount >= 20) {
            image = "20-39-percent";
        } else if (amount >= 2)  {
            image = "2-19-percent";
        } else if (amount === 1) {
            image = "1-percent";
        } else {
            throw new Error(`Unexpected ship percentage "${amount}"`);
        }

        const img = await Util.fluxpointGen({
            type:   "bitmap",
            x:      0,
            y:      0,
            width:  768,
            height: 256,
            color:  "0, 0, 0, 0"
        }, [
            {
                type:   "url",
                url:    first.avatarURL(),
                x:      0,
                y:      0,
                round:  0,
                width:  256,
                height: 256
            },
            {
                type:   "url",
                url:    `https://assets.maid.gay/ship/${image}.png`,
                x:      256,
                y:      0,
                round:  0,
                width:  256,
                height: 256
            },
            {
                type:   "url",
                url:    second.avatarURL(),
                x:      512,
                y:      0,
                round:  0,
                width:  256,
                height: 256
            }
        ], [], "png");

        if (!(img instanceof Buffer)) {
            Logger.getLogger("Ship").error(img);
            throw new TypeError("Unknown Error");
        }

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Shipping")
                .setDescription(`Shipping <@!${first.id}> and <@!${second.id}>\n**${amount}%** - ${name}`)
                .setFooter(Config.emojis.default.blueHeart)
                .setImage("attachment://ship.png")
                .toJSON(true),
            files: [{
                contents: img,
                name:     "ship.png"
            }]
        });
    });
