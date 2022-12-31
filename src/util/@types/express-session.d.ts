/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports */
import { SessionData } from "express-session";
import { type User } from "oceanic.js";

declare module "express-session" {
    interface SessionData {
        user: User;
    }
}
