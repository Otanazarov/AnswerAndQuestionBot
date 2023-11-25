"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGuard = void 0;
function adminGuard(ctx, next) {
    var _a;
    if (1754846162 == ((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id)) {
        next();
    }
    else {
        ctx.reply(`Siz admin emassiz ❌`);
    }
}
exports.adminGuard = adminGuard;
