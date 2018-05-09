import { TypeUtility } from "./type.util";
export class ObjectUtility {
    /**
     * 对象复制（可以转换key），支持驼峰和下划线的转换模式
     * 将构造并返回全新的对象
     * @param origin 源对象
     * @param map key的映射
     * @param mode key需要被转换的模式，不传，则不转换
     * @param asMap 当为true时，只返回map中指定的属性对应值（未指定在map中的将被抛弃）
     */
    static translate(origin, map, mode, asMap) {
        if (TypeUtility.isPrimitive(origin)) {
            return origin;
        }
        let isArray = TypeUtility.isArray(origin), newObject = isArray ? [] : {};
        let turnKeyByMode = (oldkey) => {
            var modes = {
                a_b: this.keyUnderlineLower,
                aB: this.keyHumpLower,
                AB: this.keyHumpUpper,
            };
            return (modes[mode] || (_ => { return _; }))(oldkey);
        };
        // 转换对象的key
        // map示例:{ user_id: "userId", user_info: { __key: "userInfo", user_name: "userName", user_age: "userAge", user_sex: "userSex"} }
        let turnKey = (oldkey, map) => {
            // 处理在map中指定了oldKey的情况
            if (TypeUtility.isObject(map) && map.hasOwnProperty(oldkey)) {
                if (TypeUtility.isString(map[oldkey]))
                    return map[oldkey];
                else if (TypeUtility.isObject(map[oldkey]))
                    return map[oldkey].hasOwnProperty("__key") ? map[oldkey]["__key"] : turnKeyByMode(oldkey);
                else
                    throw new Error("map的设定不符合预期(object.translate)");
            }
            // 没有map或map没有指定的按mode转换key
            return asMap ? null : turnKeyByMode(oldkey);
        };
        /**
         * 抽取子对象key的map，准备进入下一层对象拷贝
         */
        let nextMap = (map, key) => {
            if (TypeUtility.isNumber(key))
                return map; // key为数字，表示正在处理数组，则map仍然为当前map，不需要向下深入
            else if (TypeUtility.isObject(map) && map.hasOwnProperty(key))
                return this.deepClone(map[key]); // 还有更深的map要处理，抽取下一层map
            else
                return null;
        };
        let handle = (value, key) => {
            let nkey = isArray ? key : turnKey(key, map);
            if (nkey == null)
                return;
            if (TypeUtility.isObject(value)) {
                newObject[nkey] = ObjectUtility.translate(value, nextMap(map, key), mode);
            }
            else if (Array.isArray(value)) {
                !newObject.hasOwnProperty(nkey) && (newObject[nkey] = []);
                value.forEach((item, i) => { newObject[nkey].push(ObjectUtility.translate(item, nextMap(map, key), mode)); });
            }
            else if (TypeUtility.isPrimitive(value)) {
                newObject[nkey] = value;
            }
            else {
                throw new Error("无法处理的类型");
            }
        };
        // 数组和对象的循环方式不同
        if (Array.isArray(origin)) {
            origin.forEach((value, key) => handle(value, key));
        }
        else {
            for (let key in origin) {
                handle(origin[key], key);
            }
        }
        return newObject;
    }
    /**
     * 复制对象的属性（深度）
     * @param source 源对象
     * @param attrs 要复制的属性（未指定的属性会被抛弃），如果需要变更别名，使用格式: oldKey>newKey
     */
    static cloneAttr(source, attrs) {
        if (!source || !TypeUtility.isObjectOrArray(source))
            return source;
        let map = {};
        attrs.split(",").forEach(attr => {
            const [key, value] = attr.split(">");
            if (key)
                map[key] = value || key;
        });
        return this.translate(source, map, null, true);
    }
    /**
     * 复制对象（深度）任意数组和对象都可以
     * @param source 源对象
     */
    static clone(source) {
        if (!source || !TypeUtility.isObjectOrArray(source))
            return source;
        return this.deepClone(source);
    }
    /**
     * 对键值对的过滤，返回处理后的新数组
     * @param source 数据源，必须是{string:any}类型
     * @param iterate 迭代处理函数，返回null则抛弃，否则添加到结果
     */
    static filter(source, iterate) {
        let count = 0;
        const result = [];
        for (const key in source) {
            const x = iterate(source[key], key, count++);
            if (!TypeUtility.isNullOrUndefined(x))
                result.push(x);
        }
        return result;
    }
    /**
     * 对键值对的重新映射，始终返回映射后的数组
     * @param source 数据源，必须是{string:any}类型
     * @param iterate 迭代处理函数，无论返回任何值都被添加到结果
     */
    static map(source, iterate) {
        let count = 0;
        const result = [];
        for (const key in source) {
            result.push(iterate(source[key], key, count++));
        }
        return result;
    }
    /**
     * 遍历键值对对象
     * @param source 数据源，必须是{string:any}类型
     * @param iterate 迭代处理函数
     */
    static forEach(source, iterate) {
        let count = 0;
        for (const key in source) {
            iterate(source[key], key, count++);
        }
    }
    /**
     * 对象合并，需要注意属性名重复的问题
     * 如果重复，后面对象的属性替换前者
     * @param params 参数
     */
    static merge(...params) {
        const result = {};
        params.forEach(item => {
            this.forEach(item, (val, key) => {
                result[key] = val;
            });
        });
        return result;
    }
    static deepClone(source, destination) {
        if (TypeUtility.isWindow(source))
            throw new Error("不能复制window对象");
        if (!destination) {
            destination = source;
            if (TypeUtility.isArray(source)) {
                destination = this.deepClone(source, []);
            }
            else if (TypeUtility.isDate(source)) {
                destination = new Date(source.getTime());
            }
            else if (TypeUtility.isRegExp(source)) {
                destination = new RegExp(source.source);
            }
            else if (TypeUtility.isObject(source)) {
                destination = this.deepClone(source, {});
            }
        }
        else {
            if (source === destination)
                throw new Error("不能复制同源对象(自我复制)");
            if (TypeUtility.isArray(source)) {
                destination.length = 0;
                for (let i = 0; i < source.length; i++) {
                    destination.push(this.deepClone(source[i]));
                }
            }
            else {
                let h = destination.$$hashKey;
                for (let key in destination) {
                    delete destination[key];
                }
                for (let key in source) {
                    destination[key] = this.deepClone(source[key]);
                }
                this.setHashKey(destination, h);
            }
        }
        return destination;
    }
    ;
    static setHashKey(obj, h) {
        if (h) {
            obj.$$hashKey = h;
        }
        else {
            delete obj.$$hashKey;
        }
    }
    ;
    /**
     * 短横线分割的字符串转换成双大写驼峰
     * 示例: user_name => UserName
     */
    static keyHumpUpper(key) {
        let ret = key;
        ret = ret.replace(/^_?[a-z]/g, function (s) {
            return s.toUpperCase();
        });
        ret = ret.replace(/_([a-z])/g, function (s) {
            return s.substr(1, 1).toUpperCase();
        });
        return ret;
    }
    ;
    /**
    * 短横线分割的字符串转换成首字母小写其他大写的驼峰
    * 示例: user_name => userName
    */
    static keyHumpLower(key) {
        let ret = key, pre = ret.startsWith("_");
        ret = ret.replace(/_([a-z])/g, function (s) {
            return s.substr(1, 1).toUpperCase();
        });
        return pre ? "_" + ret.substring(1) : ret;
    }
    ;
    /**
    * 驼峰格式的字符串转换成下划线格式的
    * 示例: userName or UserName => user_name or user_name
    * 特殊：ABC or UserIP => abc or user_ip
    */
    static keyUnderlineLower(key) {
        let ret = key;
        ret = ret.replace(/[^A-Z_][A-Z]/g, function (s) {
            return s.substr(0, 1) + '_' + s.substr(1, 1);
        });
        return ret.toLowerCase();
    }
    ;
}
