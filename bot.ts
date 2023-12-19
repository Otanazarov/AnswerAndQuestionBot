import { conversations, createConversation } from "@grammyjs/conversations";
import { Bot, Context, InlineKeyboard, session, Keyboard } from "grammy";
import mysql, { Pool } from "mysql2/promise";
import {
  type Conversation,
  type ConversationFlavor,
} from "@grammyjs/conversations";
import { channelGuard } from "./guard/channel-guard";
import { adminGuard } from "./guard/admin-guard";

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

bot.command("start",channelGuard, async (ctx) => {
  if (ctx.from?.id == 175484616) {
    ctx.reply(
      "/yangiSavol - yangi test qoshish ➕\n/users - foydalanuvchilar ro'yhatini olish 📋\n/user <id> foydalanuvchini javoblarini ko'rish 🔎"
    );
  } else {
    ctx.reply(
      `Salom botimizga xush kelibsiz 👋🏿\n/savol ⁉️ - savollarga javob berish`
    );
  }
  const ID = ctx.from?.id
  const [[verify]] = await pool.query(`SELECT userTelegramID FROM user WHERE userTelegramID = ${ID}`)
  
  if(verify){
  }else{
    const message = ctx.message;
  const connection = await pool.getConnection();
  const date = new Date();
  const query =
    await `INSERT INTO user (userTelegramID,test_result,create_at) VALUES (${message?.from.id},0,'${date}')`;
  await connection.query(query);
  }
  
});

bot.hears("me", async (ctx) => {
  const thems = await getAllThemes()
  const ID = ctx.from?.id;
  for(let i in thems){
    let right = 0 
    const [user] = await pool.query(`SELECT * FROM result WHERE userTelegramID = ${ID} AND theme ='${thems[i]}'` )
    for (let i in user) {
      console.log(user[i].answers);
      if (user[i].answers=="true") {
        right++;
      }
    }
    ctx.reply(`${thems[i]},\n Sizning balingiz ${right} ✅`);
  }
});

bot.command("yangiSavol",adminGuard,async (ctx) => {
  await ctx.conversation.enter("addQuestion");
});

bot.command("users",adminGuard, async (ctx) => {
  let list = "";
  const [allUsers] = await pool.query(`SELECT id,userTelegramID FROM user`);
  for (let i in allUsers) {
    list += `ID: ${allUsers[i].id} userID:${allUsers[i].userTelegramID}\n`;
  }
  ctx.reply(list);
});

bot.hears(/\/user (\d+)/,adminGuard,async (ctx)=>{
  const userID = +ctx.match[1];
  const userName = ctx.from?.first_name
  let list = ""
  const [allUsers ]= await pool.query(`SELECT * FROM result WHERE userTelegramID = ${userID}`)
  for (let i in allUsers) {
    list += `QuestionID 🆔: ${allUsers[i].questionsID}  answer 📋: ${allUsers[i].answers}\n` ;
  }
  ctx.reply(list)
})

bot.command("savol", async (ctx) => {
  ctx.reply(`Fanlarni tanlashingiz mumkin ✅\nTest🫡`, { reply_markup: keyboard });
});

bot.on("message", async (ctx, next) => {
  const text = ctx.message.text;
  const connection = await pool.getConnection();
  const query = `SELECT question, answer, id FROM test WHERE test_name = '${text}'`;
  const [b] = await connection.query(query);

  if (b.length == 0) {
    ctx.reply("Bunday fan yoq");
    return;
  }

  const inlineKeyboard = new InlineKeyboard();
const options = b[0].answer.split("\r\n");
  for (let i in options) {
    inlineKeyboard.text(options[i], `${b[0].id},${options[i]}`);
  }
  const information = ctx.from.id;
  const [[verify]] = await pool.query(`SELECT answers,questionsID FROM result WHERE questionsID = ${b[0].id} AND userTelegramID = ${information}`)
    if(verify){
      ctx.reply(`Bu fandan savollarga javop bergansiz`)
    }else{
       ctx.reply(b[0].question, {
    reply_markup: inlineKeyboard,
  });
    }
 
}

);
var answerTrue = 0
var test_result = 0;
bot.on("callback_query:data", async (ctx) => {
  const a = ctx.callbackQuery.data;
  const information = ctx.from.id;
  const id1 = a.split(",")[0];
  const sp = a.split(",")[1];
  const connection = await pool.getConnection();
  const query = `SELECT true_answer,test_name,question,test_name,answer FROM test WHERE id = '${id1}'`;
  const [[result]] = await connection.query(query);

  if (sp == result.true_answer) {
    const [[verify]] = await pool.query(
      `SELECT answers FROM result WHERE questionsID = ${id1} AND userTelegramID = ${information}`
    );
    if (verify) {
      ctx.reply("bu savolga javop berilgan");
    } else {
      const insert = await pool.query(
        `INSERT INTO result (questionsID,answers,userTelegramID,theme) VALUES(${id1},'${true}',${information},'${result.test_name}')`
      );
      answerTrue+=1
      ctx.reply(`Javob togri`);
      ctx.deleteMessage()
    }
    const connection = await pool.getConnection();
    const query2 = `SELECT test_result FROM user WHERE userTelegramID = '${information}'`;
    const [[jv]] = await connection.query(query2);
    test_result = jv.test_result;
    const query1 = `UPDATE user SET  test_result = ${(test_result += 1)}  WHERE userTelegramID = '${information}'`;
    const [result1] = await connection.query(query1);
  } else {
    const insert = await pool.query(
      `INSERT INTO result (questionsID,answers,userTelegramID,theme) VALUES(${id1},'${false}',${information},'${result.test_name}')`
    );
    ctx.reply("Javob noto'g'ri");
    ctx.deleteMessage()

  }

  const nextQuestionID = await getNextQuestion(
    information,
    result.test_name,
    +id1
  );

  if (!nextQuestionID) {
    ctx.reply(`hamma savolarga javob berdingiz:\nSizning natijangiz 3/${answerTrue} `)
    return;
  }

  const [[nextQuestion]] = await getQuestionByID(nextQuestionID);
  

  if (!nextQuestion) return;
  const nextKeyboard = new InlineKeyboard();
  let nextAnswers: string[] = [];

  nextAnswers = nextAnswers.concat(nextQuestion.answer.split("\r\n"));
  nextAnswers.sort();

  nextKeyboard.text(nextAnswers[0], `${nextQuestion.id},${nextAnswers[0]}`);
  nextKeyboard.text(nextAnswers[1], `${nextQuestion.id},${nextAnswers[1]}`);
  nextKeyboard.text(nextAnswers[2], `${nextQuestion.id},${nextAnswers[2]}`);

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

export async function getAllThemes() {
  const [questions] = await pool.query(`SELECT test_name FROM test`)
  const themes: string[] = [];
  for (let i of questions) {
    if (!themes.includes(i.test_name)) {
      themes.push(i.test_name);
    }
  }

  return themes;
}
