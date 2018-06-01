export class TypeUtility {
    constructor() { }
    /* 类型检测的基函数 */
    static type(input) {
        var class2type = {};
        var types = "Boolean Number String Function Array Date RegExp Object".split(" ");
        for (var i = 0, len = types.length; i < len; i++) {
            class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
        }
        return input == null ? String(input) : class2type[Object.prototype.toString.call(input)] || "object";
    }
    ;
    static isDate(input) {
        return this.type(input) === "date";
    }
    ;
    static isString(input) {
        return this.type(input) === "string";
    }
    ;
    static isObject(input) {
        return this.type(input) === "object";
    }
    ;
    static isArray(input) {
        return Array.isArray(input);
    }
    ;
    static isFunction(input) {
        return input instanceof Function;
    }
    ;
    static isNumber(input) {
        return this.type(input) === "number";
    }
    ;
    static isBoolean(input) {
        return this.type(input) === "boolean";
    }
    ;
    static isRegExp(input) {
        return this.type(input) === "regexp";
    }
    ;
    static isUndefined(input) {
        return typeof input === 'undefined';
    }
    ;
    static isNull(input) {
        return input === null;
    }
    ;
    static isNullOrUndefined(input) {
        return this.isUndefined(input) || this.isNull(input);
    }
    ;
    /**
    * true = NULL or Undefined or ""
    */
    static isNone(input) {
        return this.isNullOrUndefined(input) || input === "";
    }
    ;
    static isWindow(input) {
        return input && input.document && input.location && input.alert && input.setInterval;
    }
    ;
    /**
    * 是否为值类型
    */
    static isPrimitive(input) {
        return this.isNumber(input) || this.isString(input) || this.isBoolean(input) || this.isNullOrUndefined(input);
    }
    ;
    static isObjectOrArray(input) {
        return this.isObject(input) || this.isArray(input);
    }
    ;
}
TypeUtility.isArrayOrObject = TypeUtility.isObjectOrArray;
