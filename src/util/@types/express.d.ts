/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports */
import type UserConfig from "../../db/Models/UserConfig.js";
import type { User } from "oceanic.js";

declare global {
    namespace Express {
        interface Data {
            uConfig?: UserConfig;
            user?: User;
        }

        interface Request {
            data: Data;
        }
    }

}
