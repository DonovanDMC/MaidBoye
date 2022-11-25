import Config from "../config/index.js";
import Service from "../util/Service.js";
import AutoPostingEntry, { AutoPostingTypes, ValidAutoPostingTimes } from "../db/Models/AutoPostingEntry.js";
import Yiffy from "../util/req/Yiffy.js";
import CheweyAPI from "../util/req/CheweyAPI.js";
import db from "../db/index.js";
import ServicesManager from "../util/ServicesManager.js";
import { Colors } from "../util/Constants.js";
import Logger from "../util/Logger.js";
import Util from "../util/Util.js";
import { Client } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";

const AutoPostingTitles = {
    [AutoPostingTypes.BIRB]:            "Birb!",
    [AutoPostingTypes.BLEP]:            "Blep!",
    [AutoPostingTypes.BUNNY]:           "Bunny!",
    [AutoPostingTypes.CAT]:             "Meow!",
    [AutoPostingTypes.DIKDIK]:          "Dik-Dik!",
    [AutoPostingTypes.DOG]:             "Woof!",
    [AutoPostingTypes.DUCK]:            "Quack!",
    [AutoPostingTypes.FOX]:             "Screeeeee!",
    [AutoPostingTypes.KOALA]:           "Koala!",
    [AutoPostingTypes.OTTER]:           "Cuuuute!",
    [AutoPostingTypes.OWL]:             "Hoot Hoot!",
    [AutoPostingTypes.PANDA]:           "Panda!",
    [AutoPostingTypes.SNEK]:            "Snek!",
    [AutoPostingTypes.TURTLE]:          "Turtle!",
    [AutoPostingTypes.RED_PANDA]:       "Wah!",
    [AutoPostingTypes.WOLF]:            "*Snarl*",
    [AutoPostingTypes.BOOP]:            "Boop!",
    [AutoPostingTypes.CUDDLE]:          "Awww!",
    [AutoPostingTypes.FLOP]:            "Flop!",
    [AutoPostingTypes.FURSUIT]:         "Fursuit!",
    [AutoPostingTypes.HOLD]:            "Gotchu!",
    [AutoPostingTypes.HOWL]:            "Awooo!",
    [AutoPostingTypes.HUG]:             "Hug!",
    [AutoPostingTypes.KISS]:            "Smooch!",
    [AutoPostingTypes.LICK]:            "Lickies!",
    [AutoPostingTypes.BULGE_YIFF]:      "Bulge!",
    [AutoPostingTypes.ANDROMORPH_YIFF]: "Andromorph Yiff!",
    [AutoPostingTypes.GAY_YIFF]:        "Gay Yiff!",
    [AutoPostingTypes.GYNOMORPH_YIFF]:  "Gynomorph Yiff!",
    [AutoPostingTypes.LESBIAN_YIFF]:    "Lesbian Yiff!",
    [AutoPostingTypes.STRAIGHT_YIFF]:   "Straight Yiff!"

};
export default class AutoPostingService extends Service {
    client = new Client({ auth: `Bot ${Config.clientToken}` });
    constructor(file: string, name: string) {
        super(file, name);
        void db.initIfNotReady().then(this.ready.bind(this));
        setInterval(this.run.bind(this), 1e3);
    }

    static register() {
        return ServicesManager.register("auto-posting", import.meta.url);
    }

    protected async handleMessage() {
        throw new Error("Not Implemented");
    }

    async execute(entry: AutoPostingEntry) {
        Logger.getLogger("AutoPosting").info(`Processing entry ${entry.id} for guild ${entry.guildID} (type: ${Util.readableConstant(AutoPostingTypes[entry.type])})`);
        let image: string, api: string, shortURL: string | undefined, sources: Array<string> | undefined;
        switch (entry.type) {
            case AutoPostingTypes.BIRB: {
                const img = await Yiffy.animals.birb();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.BLEP: {
                const img = await Yiffy.animals.blep();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.BUNNY: {
                image = await CheweyAPI.rabbit();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.CAT: {
                image = await CheweyAPI.cat();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.DIKDIK: {
                const img = await Yiffy.animals.dikdik();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.DOG: {
                image = await CheweyAPI.dog();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.DUCK: {
                image = await CheweyAPI.duck();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.FOX: {
                image = await CheweyAPI.fox();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.KOALA: {
                image = await CheweyAPI.koala();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.OTTER: {
                image = await CheweyAPI.otter();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.OWL: {
                image = await CheweyAPI.owl();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.PANDA: {
                image = await CheweyAPI.panda();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.SNEK: {
                image = await CheweyAPI.snake();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.TURTLE: {
                image = await CheweyAPI.turtle();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.RED_PANDA: {
                image = await CheweyAPI.redPanda();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.WOLF: {
                image = await CheweyAPI.wolf();
                api = "CheweyAPI";
                break;
            }

            case AutoPostingTypes.BOOP: {
                const img = await Yiffy.furry.boop();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.CUDDLE: {
                const img = await Yiffy.furry.cuddle();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.FLOP: {
                const img = await Yiffy.furry.flop();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.FURSUIT: {
                const img = await Yiffy.furry.fursuit();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.HOLD: {
                const img = await Yiffy.furry.hold();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.HOWL: {
                const img = await Yiffy.furry.howl();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.HUG: {
                const img = await Yiffy.furry.hug();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.KISS: {
                const img = await Yiffy.furry.kiss();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.LICK: {
                const img = await Yiffy.furry.lick();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.BULGE_YIFF: {
                const img = await Yiffy.furry.bulge();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.ANDROMORPH_YIFF: {
                const img = await Yiffy.furry.yiff.andromorph();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.GAY_YIFF: {
                const img = await Yiffy.furry.yiff.gay();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.GYNOMORPH_YIFF: {
                const img = await Yiffy.furry.yiff.gynomorph();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.LESBIAN_YIFF: {
                const img = await Yiffy.furry.yiff.lesbian();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }

            case AutoPostingTypes.STRAIGHT_YIFF: {
                const img = await Yiffy.furry.yiff.straight();
                image = img.url;
                shortURL = img.shortURL;
                sources = img.sources;
                api = "YiffyAPI";
                break;
            }
        }

        // can't use components because we're using a webhook
        await entry.execute(this.client, {
            embeds: new EmbedBuilder()
                .setTitle(AutoPostingTitles[entry.type])
                .setFooter("Automatically Posted")
                .setTimestamp(new Date().toISOString())
                .setImage(image)
                .setAuthor(api, Config.botIcon)
                .setColor(Colors.gold)
                .setDescription([
                    `[[Full Image](${shortURL ?? image})]`,
                    ...(sources && sources.length !== 0 ? sources.map(source => `[[Source (${new URL(source).hostname})](${source})]`) : [])
                ])
                .toJSON(true)
        });
    }

    async run() {
        const now = new Date();
        let time: number | undefined;
        for (const t of ValidAutoPostingTimes) {
            if ((time = now.getMinutes() % t) === 0 && now.getSeconds() === 0) {
                time = t;
                break;
            } else {
                time = undefined;
            }
        }

        if (time) {
            const entries = await AutoPostingEntry.getTime(time as 5);
            for (const entry of entries) {
                await this.execute(entry);
            }
        }
    }
}
