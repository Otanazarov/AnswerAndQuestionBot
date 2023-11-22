import { conversations, createConversation } from "@grammyjs/conversations";
import { Bot, Context, InlineKeyboard, session, Keyboard } from "grammy";
import mysql, { Pool } from "mysql2/promise";
import {
  type Conversation,
  type ConversationFlavor,
} from "@grammyjs/conversations";
// import { adminGuard } from "./guard/admin-guard";

export const pool: Pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "test_bot",
  password: "root",
  port: 8889,
});

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(
  "6937641686:AAFW8FBsCnZOJncPee41vGdJbI3CTPn7vHU"
);

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

/** Defines the conversation */
export async function addQuestion(
  conversation: MyConversation,
  ctx: MyContext
) {
  //theme
  ctx.reply("savol mavzusini yuboring");
  const theme = await conversation.form.text();

  //question
  ctx.reply("savolni yuboring");
  const text = await conversation.form.text();

  //question right answer
  ctx.reply("tog'ri javobni yuboring");
  const rightAnswer = await conversation.form.text();

  //answers
  const answers: string[] = [];
  answers.push(rightAnswer);
  for (let i = 0; i < 2; ) {
    ctx.reply(`${i + 1}inichi javobni yuboring`);

    const answer = await conversation.form.text();

    if (answers.includes(answer) || rightAnswer == answer) {
      ctx.reply("bu javob allaqachon mavjud");
    } else {
      answers.push(answer);
      i++;
    }
  }
  const db = await pool.query(
    `INSERT INTO test (test_name,question,answer,true_answer) VALUES('${theme}','${text}','${answers.join(
      "\r\n"
    )}','${rightAnswer}')`
  );
}
bot.use(createConversation(addQuestion, { id: "addQuestion" }));

// Install the conversations plugin.
const keyboard = new Keyboard()
  .text("English")
  .text("Matematika")
  .text("Fizika")
  .resized();

bot.command("start", async (ctx) => {
  if (ctx.from?.id == 175484616) {
    ctx.reply(
      "/yangiSavol - yangi test qoshish ➕\n/users - foydalanuvchilar ro'yhatini olish 📋\n/user <id> foydalanuvchini javoblarini ko'rish 🔎"
    );
  } else {
    ctx.reply(
      `Salom botimizga xush kelibsiz 👋🏿\n/savol ⁉️ - savollarga javob berish`
    );
  }
  const message = ctx.message;
  const connection = await pool.getConnection();

  const date = new Date();
  const query =
    await `INSERT INTO user (userTelegramID,test_result,create_at) VALUES (${message?.from.id},0,'${date}')`;
  await connection.query(query);
});

bot.hears("me", async (ctx) => {
  const ID = ctx.from?.id;
  const name = ctx.from?.first_name;
  const user = await pool.query(
    `SELECT * FROM user WHERE userTelegramID = ${ID}`
  );
  ctx.reply(`${name},
Sizning balingiz ${user[0][0].test_result} ✅`);
});

bot.command("yangiSavol", async (ctx) => {
  await ctx.conversation.enter("addQuestion");
});

bot.command("users", async (ctx) => {
  let list = "";
  const [allUsers] = await pool.query(`SELECT id,userTelegramID FROM user`);
  for (let i in allUsers) {
    list += `ID: ${allUsers[i].id} userID:${allUsers[i].userTelegramID}\n`;
  }
  ctx.reply(list);
});

bot.command("savol", async (ctx) => {
  ctx.reply(`Fanlarni tanlashingiz mumkin ✅\nOmad🫡`, { reply_markup: keyboard });
});

bot.on("message", async (ctx, next) => {
  const text = ctx.message.text;
  const connection = await pool.getConnection();
  const query = `SELECT question, answer, id FROM test WHERE test_name = '${text}'`;
  const [b] = await connection.query(query);
  console.log();

  if (b.length == 0) {
    ctx.reply("Bunday fan yoq");
    return;
  }

  const inlineKeyboard = new InlineKeyboard();

  for (let i in b) {
    const options = b[i].answer.split("\r\n");

    inlineKeyboard.text(options[i], `${b[i].id},${options[i]}`);
  }
  const information = ctx.from.id;
  const [[verify]] = await pool.query(`SELECT answers,questionsID FROM result WHERE questionsID = ${b[0].id} AND userTelegramID = ${information}`)
  if(verify){
    ctx.reply(`Hamma savollarga javob berilgan`)
  }else{  ctx.reply(b[0].question, {
    reply_markup: inlineKeyboard,
  });
}

});

var test_result = 0;
bot.on("callback_query:data", async (ctx) => {
  const a = ctx.callbackQuery.data;
  const information = ctx.from.id;
  const id1 = a.split(",")[0];
  const sp = a.split(",")[1];
  const connection = await pool.getConnection();
  const query = `SELECT true_answer,test_name,question,answer FROM test WHERE id = '${id1}'`;
  const [[result]] = await connection.query(query);
  console.log(result);
  
  if (sp == result.true_answer) {
    const [[verify]] = await pool.query(
      `SELECT answers FROM result WHERE questionsID = ${id1} AND userTelegramID = ${information}`
    );
    if (verify) {
      ctx.reply("bu savolga javop berilgan");
    } else {
      const insert = await pool.query(
        `INSERT INTO result (questionsID,answers,userTelegramID) VALUES(${id1},'${sp}',${information})`
      );
      ctx.reply(`Javob togri`);
    }

    const connection = await pool.getConnection();
    const query2 = `SELECT test_result FROM user WHERE userTelegramID = '${information}'`;
    const [[jv]] = await connection.query(query2);
    test_result = jv.test_result;
    const query1 = `UPDATE user SET  test_result = ${(test_result += 1)}  WHERE userTelegramID = '${information}'`;
    const [result1] = await connection.query(query1);
  } else {
    ctx.reply("Javob noto'g'ri");
  }

  const nextQuestionID = await getNextQuestion(
    information,
    result.test_name,
    +id1
  );

  if (!nextQuestionID) {
    let out = "hamma savolarga javob berdingiz:\n";
    ctx.reply(out);
    return;
  }

  const [[nextQuestion]] = await getQuestionByID(nextQuestionID);
  console.log(nextQuestion);
  

  if (!nextQuestion) return;
  const nextKeyboard = new InlineKeyboard();
  let nextAnswers: string[] = [];

  nextAnswers = nextAnswers.concat(nextQuestion.answer.split("\r\n"));
  nextAnswers.sort();

  nextKeyboard.text(nextAnswers[0], `${nextQuestion.id},${nextAnswers[0]}`);
  nextKeyboard.text(nextAnswers[1], `${nextQuestion.id},${nextAnswers[1]}`);
  nextKeyboard.text(nextAnswers[2], `${nextQuestion.id},${nextAnswers[2]}`);

  const currentKeyboard = new InlineKeyboard();
  let allAnswers: string[] = [];

  allAnswers = allAnswers.concat(result.answer.split("\r\n"));
  allAnswers.sort();

  currentKeyboard.text(allAnswers[0]);
  currentKeyboard.text(allAnswers[1]);
  currentKeyboard.text(allAnswers[2]);
  ctx.editMessageText(result.question, { reply_markup: currentKeyboard });
  ctx.reply(nextQuestion.question, { reply_markup: nextKeyboard });
});

bot.start({ drop_pending_updates: true });

async function getNextQuestion(
  userID: number,
  theme: string,
  currentQuestionID: number
) {
  const questionsQuery = `SELECT id FROM test WHERE test_name = '${theme}'`;
  const resultsQuery = `SELECT questionsID FROM result WHERE userTelegramID= '${userID}'`;

  const [questions] = await pool.query(questionsQuery);
  const [results] = await pool.query(resultsQuery);

  let list: number[] = questions.map((v: any) => {
    return v.id;
  });

  list.splice(list.indexOf(currentQuestionID), 1);
  for (let i in results) {
    const result = results[i];
    list = list.filter((v) => {
      if (result.questionsID == v) {
        return false;
      } else {
        return true;
      }
    });
  }
  if (list.length != 0) {
    return list[0];
  } else {
    return undefined;
  }
}

export async function getQuestionByID(ID: number) {
  const query = `SELECT * FROM test WHERE ID = ${ID}`;
  return await pool.query(query);
}

export async function getResultsByTheme(userID: string, theme: string) {
  const query = `SELECT * FROM result
    JOIN questions ON results.question_id = questions.ID
    JOIN users ON results.user_id = users.ID
    WHERE questions.theme = '${theme}' AND users.ID = '${userID}'`;
  return await pool.query(query);
}
