import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context } from "grammy";

export type NewConversation = Conversation<Context & ConversationFlavor>;