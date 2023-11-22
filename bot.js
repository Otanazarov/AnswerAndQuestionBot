"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResultsByTheme = exports.getQuestionByID = exports.addQuestion = exports.pool = void 0;
const conversations_1 = require("@grammyjs/conversations");
const grammy_1 = require("grammy");
const promise_1 = __importDefault(require("mysql2/promise"));
// import { adminGuard } from "./guard/admin-guard";
exports.pool = promise_1.default.createPool({
    host: "localhost",
    user: "root",
    database: "test_bot",
    password: "root",
    port: 8889,
});
const bot = new grammy_1.Bot("6937641686:AAFW8FBsCnZOJncPee41vGdJbI3CTPn7vHU");
bot.use((0, grammy_1.session)({ initial: () => ({}) }));
bot.use((0, conversations_1.conversations)());
/** Defines the conversation */
function addQuestion(conversation, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        //theme
        ctx.reply("savol mavzusini yuboring");
        const theme = yield conversation.form.text();
        //question
        ctx.reply("savolni yuboring");
        const text = yield conversation.form.text();
        //question right answer
        ctx.reply("tog'ri javobni yuboring");
        const rightAnswer = yield conversation.form.text();
        //answers
        const answers = [];
        answers.push(rightAnswer);
        for (let i = 0; i < 2;) {
            ctx.reply(`${i + 1}inichi javobni yuboring`);
            const answer = yield conversation.form.text();
            if (answers.includes(answer) || rightAnswer == answer) {
                ctx.reply("bu javob allaqachon mavjud");
            }
            else {
                answers.push(answer);
                i++;
            }
        }
        const db = yield exports.pool.query(`INSERT INTO test (test_name,question,answer,true_answer) VALUES('${theme}','${text}','${answers.join("\r\n")}','${rightAnswer}')`);
    });
}
exports.addQuestion = addQuestion;
bot.use((0, conversations_1.createConversation)(addQuestion, { id: "addQuestion" }));
// Install the conversations plugin.
const keyboard = new grammy_1.Keyboard()
    .text("English")
    .text("Matematika")
    .text("Fizika")
    .resized();
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) == 175484616) {
        ctx.reply("/yangiSavol - yangi test qoshish ➕\n/users - foydalanuvchilar ro'yhatini olish 📋\n/user <id> foydalanuvchini javoblarini ko'rish 🔎");
    }
    else {
        ctx.reply(`Salom botimizga xush kelibsiz 👋🏿\n/savol ⁉️ - savollarga javob berish`);
    }
    const message = ctx.message;
    const connection = yield exports.pool.getConnection();
    const date = new Date();
    const query = yield `INSERT INTO user (userTelegramID,test_result,create_at) VALUES (${message === null || message === void 0 ? void 0 : message.from.id},0,'${date}')`;
    yield connection.query(query);
}));
bot.hears("me", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const ID = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id;
    const name = (_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name;
    const user = yield exports.pool.query(`SELECT * FROM user WHERE userTelegramID = ${ID}`);
    ctx.reply(`${name},
Sizning balingiz ${user[0][0].test_result} ✅`);
}));
bot.command("yangiSavol", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.conversation.enter("addQuestion");
}));
bot.command("users", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let list = "";
    const [allUsers] = yield exports.pool.query(`SELECT id,userTelegramID FROM user`);
    for (let i in allUsers) {
        list += `ID: ${allUsers[i].id} userID:${allUsers[i].userTelegramID}\n`;
    }
    ctx.reply(list);
}));
bot.command("savol", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.reply(`Fanlarni tanlashingiz mumkin ✅\nOmad🫡`, { reply_markup: keyboard });
}));
bot.on("message", (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.message.text;
    const connection = yield exports.pool.getConnection();
    const query = `SELECT question, answer, id FROM test WHERE test_name = '${text}'`;
    const [b] = yield connection.query(query);
    console.log();
    if (b.length == 0) {
        ctx.reply("Bunday fan yoq");
        return;
    }
    const inlineKeyboard = new grammy_1.InlineKeyboard();
    for (let i in b) {
        const options = b[i].answer.split("\r\n");
        inlineKeyboard.text(options[i], `${b[i].id},${options[i]}`);
    }
    const information = ctx.from.id;
    const [[verify]] = yield exports.pool.query(`SELECT answers,questionsID FROM result WHERE questionsID = ${b[0].id} AND userTelegramID = ${information}`);
    if (verify) {
        ctx.reply(`Hamma savollarga javob berilgan`);
    }
    else {
        ctx.reply(b[0].question, {
            reply_markup: inlineKeyboard,
        });
    }
}));
var test_result = 0;
bot.on("callback_query:data", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const a = ctx.callbackQuery.data;
    const information = ctx.from.id;
    const id1 = a.split(",")[0];
    const sp = a.split(",")[1];
    const connection = yield exports.pool.getConnection();
    const query = `SELECT true_answer,test_name,question,answer FROM test WHERE id = '${id1}'`;
    const [[result]] = yield connection.query(query);
    console.log(result);
    if (sp == result.true_answer) {
        const [[verify]] = yield exports.pool.query(`SELECT answers FROM result WHERE questionsID = ${id1} AND userTelegramID = ${information}`);
        if (verify) {
            ctx.reply("bu savolga javop berilgan");
        }
        else {
            const insert = yield exports.pool.query(`INSERT INTO result (questionsID,answers,userTelegramID) VALUES(${id1},'${sp}',${information})`);
            ctx.reply(`Javob togri`);
        }
        const connection = yield exports.pool.getConnection();
        const query2 = `SELECT test_result FROM user WHERE userTelegramID = '${information}'`;
        const [[jv]] = yield connection.query(query2);
        test_result = jv.test_result;
        const query1 = `UPDATE user SET  test_result = ${(test_result += 1)}  WHERE userTelegramID = '${information}'`;
        const [result1] = yield connection.query(query1);
    }
    else {
        ctx.reply("Javob noto'g'ri");
    }
    const nextQuestionID = yield getNextQuestion(information, result.test_name, +id1);
    if (!nextQuestionID) {
        let out = "hamma savolarga javob berdingiz:\n";
        ctx.reply(out);
        return;
    }
    const [[nextQuestion]] = yield getQuestionByID(nextQuestionID);
    console.log(nextQuestion);
    if (!nextQuestion)
        return;
    const nextKeyboard = new grammy_1.InlineKeyboard();
    let nextAnswers = [];
    nextAnswers = nextAnswers.concat(nextQuestion.answer.split("\r\n"));
    nextAnswers.sort();
    nextKeyboard.text(nextAnswers[0], `${nextQuestion.id},${nextAnswers[0]}`);
    nextKeyboard.text(nextAnswers[1], `${nextQuestion.id},${nextAnswers[1]}`);
    nextKeyboard.text(nextAnswers[2], `${nextQuestion.id},${nextAnswers[2]}`);
    const currentKeyboard = new grammy_1.InlineKeyboard();
    let allAnswers = [];
    allAnswers = allAnswers.concat(result.answer.split("\r\n"));
    allAnswers.sort();
    currentKeyboard.text(allAnswers[0]);
    currentKeyboard.text(allAnswers[1]);
    currentKeyboard.text(allAnswers[2]);
    ctx.editMessageText(result.question, { reply_markup: currentKeyboard });
    ctx.reply(nextQuestion.question, { reply_markup: nextKeyboard });
}));
bot.start({ drop_pending_updates: true });
function getNextQuestion(userID, theme, currentQuestionID) {
    return __awaiter(this, void 0, void 0, function* () {
        const questionsQuery = `SELECT id FROM test WHERE test_name = '${theme}'`;
        const resultsQuery = `SELECT questionsID FROM result WHERE userTelegramID= '${userID}'`;
        const [questions] = yield exports.pool.query(questionsQuery);
        const [results] = yield exports.pool.query(resultsQuery);
        let list = questions.map((v) => {
            return v.id;
        });
        list.splice(list.indexOf(currentQuestionID), 1);
        for (let i in results) {
            const result = results[i];
            list = list.filter((v) => {
                if (result.questionsID == v) {
                    return false;
                }
                else {
                    return true;
                }
            });
        }
        if (list.length != 0) {
            return list[0];
        }
        else {
            return undefined;
        }
    });
}
function getQuestionByID(ID) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT * FROM test WHERE ID = ${ID}`;
        return yield exports.pool.query(query);
    });
}
exports.getQuestionByID = getQuestionByID;
function getResultsByTheme(userID, theme) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT * FROM result
    JOIN questions ON results.question_id = questions.ID
    JOIN users ON results.user_id = users.ID
    WHERE questions.theme = '${theme}' AND users.ID = '${userID}'`;
        return yield exports.pool.query(query);
    });
}
exports.getResultsByTheme = getResultsByTheme;
