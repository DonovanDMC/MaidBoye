import Command, { type CommandInteraction, type ComponentInteraction } from "../../../util/cmd/Command.js";
import E621, { filterPosts } from "../../../util/req/E621.js";
import E621TagsState from "../../../interactions/components/E621TagsState.js";
import { State } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import type { E621ThumbnailType } from "../../../db/Models/UserConfig.js";
import E621Thumbnail from "../../../util/E621Thumbnail.js";
import Config from "../../../config/index.js";
import Logger from "@uwu-codes/logger";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { Post } from "e621";
import { ApplicationCommandOptionTypes, InteractionTypes, type MessageActionRow } from "oceanic.js";

export const orders = [
    "id", "-id",
    "score", "-score",
    "favcount", "-facount",
    "random"
];
export default new Command(import.meta.url, "e621")
    .setDescription("Search for posts from e621")
    .setRestrictions("nsfw")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "tags")
            .setDescription("The tags to search with - autocomplete supported")
            .setAutocomplete(true)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "order")
            .setDescription("The ordering of posts (default: Highest Favorites First)")
            .addChoice("Oldest First", "id")
            .addChoice("Newest First", "-id")
            .addChoice("Highest Score First", "score")
            .addChoice("Lowest Score First", "-score")
            .addChoice("Highest Favorites First", "favcount")
            .addChoice("Lowest Favorites First", "-favcount")
            .addChoice("Random", "random")
    )
    .setAck("ephemeral-user")
    .setCooldown(1e4)
    .setOptionsParser(interaction => ({
        tags:  (interaction.data.options.getString("tags") || "").split(" ").filter(Boolean),
        order: (interaction.data.options.getString("order") || "favcount").trim()
    }))
    .setUserLookup(true)
    .setExecutor(async function(interaction, { tags, order }, gConfig, uConfig) {
        tags = tags.slice(0, 40);
        if (!tags.some(t => t.startsWith("order:"))) {
            tags.push(`order:${order}`);
        }
        let q: Array<Post>;
        try {
            q = await E621.posts.search({ tags, limit: 100 });
        } catch (err) {
            Logger.getLogger("Commands[e621]").error(err);
            return interaction.reply({
                content: "An error occurred while searching e621. Please try again later. You can also check <https://status.e621.ws> to see if e621 is down."
            });
        }
        const state = await E621TagsState.store(tags);
        const posts = filterPosts(q, uConfig.preferences.e621NoVideo, uConfig.preferences.e621NoFlash);
        if (posts.length === 0) {
            return interaction.reply({ content: `Search returned no results.${q.length === posts.length ? "" : ` (${q.length} posts were filtered out due to Discord ToS)`}` });
        }
        return makeMessage(interaction, orders.indexOf(order), 0, posts, state, uConfig.preferences.e621ThumbnailType);
    });

export async function makeMessage(interaction: CommandInteraction | ComponentInteraction, order: number, index: number, posts: Array<Post>, state: string, thumbType: E621ThumbnailType) {
    const post = posts[index];
    if (!post) {
        throw new Error(`couldn't find post to display (total: ${posts.length}, index: ${index}, state: ${state})`);
    }
    const embed = Util.makeEmbed(true, interaction.user)
        .setTitle(`Artist: ${post.tags.artist.filter(t => !["sound_warning", "conditional_dnp"].includes(t)).join(", ")}`)
        .setFooter(`Post ${index + 1}/${posts.length} | Score: ${post.score.total} | Favorites: ${post.fav_count}`, Config.botIcon);
    if (post.file.ext === "webm") {
        embed.setDescription(`This post is a video. To fully view it, you must go to it on [e621](https://e621.net/posts/${post.id})`);
        if (thumbType !== "none") {
            embed.setImage("https://assets.maidboye.cafe/loading.gif");
            if (thumbType === "image") {
                embed.setDescription(`${embed.getDescription()!}\n\n(note: generating image thumbnails can take 10+ seconds)`);
            }

        }
    } else if (post.file.ext === "swf") {
        embed.setDescription(`This post is a flash animation. To fully view it, you must go to it on [e621](https://e621.net/posts/${post.id}) (and go back to 2020)`);
    } else {
        embed.setImage(post.file.url);
    }
    await (interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))({
        embeds:     embed.toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "e621", "nav").with("tags", state).with("order", order).with("index", index).with("dir", -2).encode(),
                disabled: index === 0,
                label:    "First",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "e621", "nav").with("tags", state).with("order", order).with("index", index).with("dir", -1).encode(),
                disabled: posts.length === 1,
                label:    "Previous",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "e621", "nav").with("tags", state).with("order", order).with("index", index).with("dir", 1).encode(),
                disabled: posts.length === 1,
                label:    "Next",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "e621", "nav").with("tags", state).with("order", order).with("index", index).with("dir", 2).encode(),
                disabled: index === (posts.length - 1),
                label:    "Last",
                style:    ButtonColors.BLURPLE
            })
            .addURLButton({
                label: "Open Externally",
                url:   `https://e621.net/posts/${post.id}`
            })
            .toJSON()
    });
    if (post.file.ext === "webm" && thumbType !== "none") {
        const { id } = await interaction.getOriginal();
        E621Thumbnail.addPending(id, post.id);
        const thumb = await E621Thumbnail.create(post.file.url, post.file.md5, thumbType);
        const stillPending = E621Thumbnail.hasPending(id, post.id);
        // if this is false, they've navigated away
        if (stillPending) {
            E621Thumbnail.removePending(id);
            embed.setImage(thumb);
            await interaction.editOriginal({
                embeds: embed.toJSON(true)
            });
        }
    }
}
