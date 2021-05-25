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

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = class Rule {
    constructor(pathRule) {
        // pathRuleRegx 描述 `路径规则语法` 的正则表达式
        this.pathRuleRegx = regex`
            (?<static>[^{]*)                               // 匹配静态部分
            {
                (?:                                        // 匹配可选的转换器部分
                    (?<converter>[a-zA-Z_][a-zA-Z0-9_]*)   // 转换器的名称
                    :
                )?
                (?<variable>[a-zA-Z_][a-zA-Z0-9_]*)        // 匹配变量名
            }
            ${"g"}
        `
        this.pathRule = pathRule
        this.pathRuleContext = null
    }

    bind(layer) {
        this.layer = layer
        this.buildPathRule()
    }

    /**
     * 从用户编写的路径规则中提取出变量、转换信息
     * @param {String} rule 用户编写的路径规则
     */
    parseRuleInfoFromRegx() {
        let pos = 0
        let end = this.pathRule.length
        const matches = []
        while (pos < end) {
            const m = this.pathRuleRegx.exec(this.pathRule)
            if (!m) break;
            // 每次匹配捕获的信息字典
            matches.push(m.groups)
            // 下一次开始匹配的位置
            pos = m.index + m[0].length
        }
        // 匹配不了的剩余静态部分
        if (pos < end) {
            matches.push({
                remaining: this.pathRule.slice(pos)
            })
        }
        return matches
    }

    /**
    * 根据用户编写的路径规则，生成最终匹配的正则表达式及上下文信息
    * @param {RegExp} ruleRegx: 上文中的匹配路径规则的正则表达式
    * @param {String} rule pathRule: 例 /user/{toInt:id}
    */
    buildPathRule() {
        const matches = this.parseRuleInfoFromRegx()
        const pathContext = {
            converters: {},
            regex: "",
        }
        matches.forEach(o => {
            // 保存变量名与转换函数的映射
            // 之后匹配到变量对应路径中的部分时，直接使用变量名索引转换函数进行转换
            const convObj = this.layer.converters[o.converter || 'default']
            pathContext.converters[
                o.variable
            ] = convObj

            if (o.static) {
                // 匹配的路径规则中的静态部分，直接拼接到正则中
                pathContext.regex += escapeRegex(o.static)
            }
            // 变量值捕获部分的子正则
            pathContext.regex += `(?<${o.variable}>${convObj.regex})`
            if (o.remaining) {
                // 剩余无变量的静态匹配部分
                pathContext.regex += escapeRegex(o.remaining)
            }
        })
        this.pathRuleContext = pathContext
    }
        
    match(path) {
        const c = this.pathRuleContext
        let vars = null
        let isMatch = false
        const matches = [...path.matchAll(new RegExp(c.regex, "g"))]
        if (Array.isArray(matches) && matches.length > 0) {
            isMatch = true
            vars = matches[0].groups
        }

        if (vars) {
            Object.keys(vars).forEach(name => {
                const convObj = c.converters[name]
                if (convObj) {
                    vars[name] = convObj.toValue(vars[name])
                }
            })
        }
        return {
            isMatch,
            vars,
        };
    }
}

