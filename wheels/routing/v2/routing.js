const clean = (piece) => (piece
    .replace(/((^|\n)(?:[^\/\\]|\/[^*\/]|\\.)*?)\s*\/\*(?:[^*]|\*[^\/])*(\*\/|)/g, '$1')
    .replace(/((^|\n)(?:[^\/\\]|\/[^\/]|\\.)*?)\s*\/\/[^\n]*/g, '$1')
    .replace(/\n\s*/g, '')
);
const regex = ({raw}, flag) => (
    // new RegExp(interpolations.reduce(
    //     (regex, insert, index) => (regex + insert + clean(raw[index + 1])),
    //     clean(raw[0])
    // ))
    new RegExp(clean(raw[0]), flag || "")
);

module.exports = class Router {
    constructor() {
        this.routes = []
        this.converters = {
            toInt: (i) => parseInt(i, 10),
            toFloat: (i) => parseFloat(i),
        }
        this.ruleRegx = regex`
            (?<static>[^{]*)                            // 匹配静态部分
            {
                (?:                                     // 匹配可选的转换器部分
                    (?<converter>[a-zA-Z_][a-zA-Z0-9_]*)   // 如果有转换器部分，必定有转换器的名称
                    (?:                                 // 转换器的参数是可选的
                        \((?<args>.*?)\)
                    )?
                    :
                )?
                (?<variable>[a-zA-Z_][a-zA-Z0-9_]*)         // 匹配变量名
            }
            ${"g"}
        `
    }

    buildRule(regs, options) {
        return new RegExp(
            regs
                .map(function (reg) {
                    return reg.source;
                })
                .join(""),
            options
        );
    }

    /**
    * ruleRegx: 上文中的匹配路径规则的正则表达式
    * pathRule: 例 /user/{toInt(radix=10):id}/{toFloat:num}
    */
    buildPathRuleRegx(ruleRegx, pathRule) {
        let pos = 0
        let end = pathRule.length
        const matches = []
        while (pos < end) {
            const m = ruleRegx.exec(pathRule)
            if (m) {
                matches.push(m.groups)
                pos = m.index + m[0].length
            }
        }
        const pathContext = {
            converters: {},
            regx: "",
        }
        matches.forEach(o => {
            if (o.static) {
                // 匹配的路径规则中的静态部分，直接拼接到正则中
                pathContext.regx += o.static
            }
            if (o.converter) {
                // 保存变量名与转换函数的映射
                // 之后匹配到变量对应路径中的部分时，直接使用变量名索引转换函数进行转换
                pathContext.converters[
                    o.variable
                ] = this.converters[o.converter]
            }
            // 变量捕获
            pathContext.regx += `(?<${o.variable}>[a-zA-Z_][a-zA-Z0-9_]*)`
        })
        return pathContext
    }

    addRoute(pathRule, handler) {
        const context = this.buildPathRuleRegx(this.ruleRegx, pathRule)
        this.routes.push({
            path: pathRule,
            context,
            handler,
        });
    }

    match(path) {
        this.routes.forEach(r => {
            const c = r.context;
            const h = r.handler;
            const regx = new RegExp(c.regx, "g")

            let pos = 0
            let end = path.length
            const matches = []
            while (pos < end) {
                const m = regx.exec(path)
                if (m) {
                    matches.push(m.groups)
                    pos = m.index + m[0].length
                }
            }

            let vars = null
            matches.forEach(m => {
                if (!vars) vars = {}
                vars = {
                    ...vars,
                    ...m,
                }
            })

            if (vars) {
                Object.keys(vars).forEach(name => {
                    const conv = c.converters[name]
                    if (conv) {
                        vars[name] = conv(vars[name])
                    }
                })
                return {
                    handler,
                    vars,
                }
            }
            return null;
        })
    }
};
