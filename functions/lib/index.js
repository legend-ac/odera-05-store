"use strict";
// functions/src/index.ts
/**
 * ODERA 05 Store - Cloud Functions
 * Production-ready backend functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onProductWrite = exports.optimizeImage = exports.submitPayment = exports.onOrderStatusChange = exports.cancelExpiredOrders = exports.createOrder = void 0;
var createOrder_1 = require("./orders/createOrder");
Object.defineProperty(exports, "createOrder", { enumerable: true, get: function () { return createOrder_1.createOrder; } });
var cancelExpiredOrders_1 = require("./orders/cancelExpiredOrders");
Object.defineProperty(exports, "cancelExpiredOrders", { enumerable: true, get: function () { return cancelExpiredOrders_1.cancelExpiredOrders; } });
var onOrderStatusChange_1 = require("./orders/onOrderStatusChange");
Object.defineProperty(exports, "onOrderStatusChange", { enumerable: true, get: function () { return onOrderStatusChange_1.onOrderStatusChange; } });
var submitPayment_1 = require("./payments/submitPayment");
Object.defineProperty(exports, "submitPayment", { enumerable: true, get: function () { return submitPayment_1.submitPayment; } });
var optimizeImage_1 = require("./images/optimizeImage");
Object.defineProperty(exports, "optimizeImage", { enumerable: true, get: function () { return optimizeImage_1.optimizeImage; } });
var generateSearchTokens_1 = require("./products/generateSearchTokens");
Object.defineProperty(exports, "onProductWrite", { enumerable: true, get: function () { return generateSearchTokens_1.onProductWrite; } });
//# sourceMappingURL=index.js.map