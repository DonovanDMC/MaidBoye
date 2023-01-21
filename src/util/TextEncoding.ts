import Base91 from "./Base91";
import Logger from "./Logger";

export default class TextEncoding {
    static decode(data: string) {
        if (data.charAt(1) === "-") {
            switch (Number(data.charAt(0))) {
                case 1: {
                    return Base91.decode(data.slice(2));
                }

                default: {
                    Logger.getLogger("TextEncoding").warn("Unknown encoding version: %d (%s)", Number(data.charAt(0)), data);
                    return Buffer.from(data, "base64url").toString("ascii");
                }
            }
        } else {
            // bakcwards compatibility
            return Buffer.from(data, "base64url").toString("ascii");
        }
    }

    static encode(data: string) {
        // using base91 over base64 gives us ~10% more space
        return `1-${Base91.encode(data)}`;
    }
}
