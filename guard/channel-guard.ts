// import { InlineKeyboard, NextFunction } from "grammy";

// export async function channelGuard(ctx: NewContext, next: NextFunction) {
//   const user = ctx.from;
//   if (user) {
//     const chatMember = await ctx.api.getChatMember(env.CHANNEL_ID, user.id);
//     if (["kicked", "left"].includes(chatMember.status)) {
//       ctx.reply("botdan foydalanish uchun kanallarimizga obuna bo'ling", {
//         reply_markup: new InlineKeyboard().url("kanal", env.CHANNEL_LINK),
//       });
//     } else {
//       next();
//     }
//   }
// }
