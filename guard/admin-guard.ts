
import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context, NextFunction } from "grammy";
type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;
export function adminGuard(ctx: MyContext, next: NextFunction) {
	if (1754846162== ctx.from?.id) {
		next();
	}else{
        ctx.reply(`Siz admin emassiz ❌`)
    }
}
