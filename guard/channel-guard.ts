import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context, InlineKeyboard, NextFunction } from "grammy";
type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;
export async function channelGuard(ctx:MyContext, next: NextFunction) {
  const user = ctx.from;
  if (user) {
    const chatMember = await ctx.api.getChatMember(-1001906616055, user.id);
    if (["kicked", "left"].includes(chatMember.status)) {
      ctx.reply("botdan foydalanish uchun kanallarimizga obuna bo'ling", {
        reply_markup: new InlineKeyboard().url("kanal", 'https://t.me/mychannel094'),
      });
    } else {
      next();
    }
  }
}

