import { Context } from "./context"

export const userCount = () => {
    return Object.keys(Context.it.users).length;
}