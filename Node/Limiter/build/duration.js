"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Duration_ms;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Duration = void 0;
class Duration {
    constructor(ms) {
        _Duration_ms.set(this, void 0);
        __classPrivateFieldSet(this, _Duration_ms, ms, "f");
    }
    get ms() {
        return __classPrivateFieldGet(this, _Duration_ms, "f");
    }
    static FromMilliseconds(ms) {
        return new Duration(ms);
    }
    static FromSeconds(seconds) {
        return Duration.FromMilliseconds(60 * seconds);
    }
    static FromMinutes(minutes) {
        return Duration.FromSeconds(60 * minutes);
    }
    static FromHours(hours) {
        return Duration.FromMinutes(60 * hours);
    }
    static FromDays(days) {
        return Duration.FromHours(24 * days);
    }
    static FromMonths(months) {
        return Duration.FromDays(30 * months);
    }
}
exports.Duration = Duration;
_Duration_ms = new WeakMap();
