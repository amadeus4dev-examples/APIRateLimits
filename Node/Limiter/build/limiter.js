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
var _Limiter_limiter, _Limiter_globalLimit, _Limiter_globalRefresh, _Limiter_remainingPermissions, _Limiter_globalLimiterLastRefresh;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Limiter = void 0;
const bottleneck_1 = require("bottleneck");
const duration_1 = require("./duration");
const TEST_REFRESH = duration_1.Duration.FromMilliseconds(400);
const PROD_REFRESH = duration_1.Duration.FromMilliseconds(4000);
const TEST_LIMIT_FOR_PERIOD = 1;
const PROD_LIMIT_FOR_PERIOD = 40;
const TEST_MAX_CONCURRENT = 10;
const PROD_MAX_CONCURRENT = 40;
const DEFAULT_MAX_QUEUE = 100;
const GLOBAL_NOT_SET = new Error('Global limits were not set but attempt to be used');
class Limiter {
    constructor(refresh, limit, maxConcurrent, maxQueue) {
        _Limiter_limiter.set(this, void 0);
        _Limiter_globalLimit.set(this, void 0);
        _Limiter_globalRefresh.set(this, void 0);
        _Limiter_remainingPermissions.set(this, void 0);
        _Limiter_globalLimiterLastRefresh.set(this, void 0);
        __classPrivateFieldSet(this, _Limiter_limiter, new bottleneck_1.default({
            maxConcurrent,
            reservoir: limit,
            reservoirRefreshInterval: refresh.ms,
            reservoirRefreshAmount: limit,
            highWater: maxQueue
        }), "f");
        __classPrivateFieldSet(this, _Limiter_globalLimit, -1, "f");
    }
    static forTest() {
        return new Limiter(TEST_REFRESH, TEST_LIMIT_FOR_PERIOD, TEST_MAX_CONCURRENT, DEFAULT_MAX_QUEUE);
    }
    static forProduction() {
        return new Limiter(PROD_REFRESH, PROD_LIMIT_FOR_PERIOD, PROD_MAX_CONCURRENT, DEFAULT_MAX_QUEUE);
    }
    static custom(refresh, limit) {
        return new Limiter(refresh, limit, TEST_MAX_CONCURRENT, DEFAULT_MAX_QUEUE);
    }
    getPermission() {
        var _a;
        let allowed = false;
        if (__classPrivateFieldGet(this, _Limiter_globalLimit, "f") > 0) {
            if (__classPrivateFieldGet(this, _Limiter_globalLimiterLastRefresh, "f") === undefined || __classPrivateFieldGet(this, _Limiter_globalRefresh, "f") === undefined
                || __classPrivateFieldGet(this, _Limiter_remainingPermissions, "f") === undefined)
                throw GLOBAL_NOT_SET;
            if (Date.now() - __classPrivateFieldGet(this, _Limiter_globalLimiterLastRefresh, "f") >= __classPrivateFieldGet(this, _Limiter_globalRefresh, "f").ms) {
                console.log('Refreshing global limiter');
                __classPrivateFieldSet(this, _Limiter_remainingPermissions, __classPrivateFieldGet(this, _Limiter_globalLimit, "f"), "f");
                __classPrivateFieldSet(this, _Limiter_globalLimiterLastRefresh, Date.now(), "f");
            }
            if (__classPrivateFieldGet(this, _Limiter_remainingPermissions, "f") > 0) {
                allowed = true;
                __classPrivateFieldSet(this, _Limiter_remainingPermissions, (_a = __classPrivateFieldGet(this, _Limiter_remainingPermissions, "f"), _a--, _a), "f");
                console.log(`Permission acquired. Remaining: ${__classPrivateFieldGet(this, _Limiter_remainingPermissions, "f")}. Time to refresh: ${__classPrivateFieldGet(this, _Limiter_globalRefresh, "f").ms - (Date.now() - __classPrivateFieldGet(this, _Limiter_globalLimiterLastRefresh, "f"))}`);
            }
        }
        else
            allowed = true;
        return allowed;
    }
    setGlobalLimits(globalRefresh, globalLimit) {
        __classPrivateFieldSet(this, _Limiter_globalRefresh, globalRefresh, "f");
        __classPrivateFieldSet(this, _Limiter_globalLimit, globalLimit, "f");
        __classPrivateFieldSet(this, _Limiter_globalLimiterLastRefresh, Date.now(), "f");
        __classPrivateFieldSet(this, _Limiter_remainingPermissions, globalLimit, "f");
        return this;
    }
    wrap(fn) {
        return (params) => {
            if (this.getPermission())
                return __classPrivateFieldGet(this, _Limiter_limiter, "f").schedule(() => fn(params));
            else
                throw new Error("Maximum global requests reached");
        };
    }
}
exports.Limiter = Limiter;
_Limiter_limiter = new WeakMap(), _Limiter_globalLimit = new WeakMap(), _Limiter_globalRefresh = new WeakMap(), _Limiter_remainingPermissions = new WeakMap(), _Limiter_globalLimiterLastRefresh = new WeakMap();
