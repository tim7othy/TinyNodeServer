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

    buildPathRegx(ruleRegx, pathRule) {
        let pos = 0
        let end = pathRule.length
        const data = []
        while (pos < end) {
            const m = ruleRegx.exec(pathRule)
            if (m) {
                data.push(m.groups)
                pos = m.index + m[0].length
            }
        }
        return data
    }

    addRoute(pathRule, handler) {
        const data = this.buildPathRegx(this.ruleRegx, pathRule)
        const routeRule = {
            converters: {},
            regx: "",
            handler,
        }
        data.forEach(o => {
            if (o.static) {
                pathContext.regx += o.static
            }
            if (o.converter) {
                pathContext.converters['variable'] = this.converters[o.converter]
            }
            pathContext.regx += "{(?<variable>[a-zA-Z_][a-zA-Z0-9_]*)}"
        })
        this.routes.push(routeRule);
    }

    match(path) {
        this.routes.forEach(r => {
            const contexts = this.buildPathRegx(new RegExp(r.regx, "g"), path)
            if (contexts) {
                contexts.map(c => {
                    const conv = r.converters[c.variable]
                    let v;
                    if (conv) {
                        v = conv()
                    }
                })
            }
        })
    }
};
