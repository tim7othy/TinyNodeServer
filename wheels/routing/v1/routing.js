module.exports = class Router {
    constructor() {
        this.routes = []
        this.converters = {
            toInt: (i) => parseInt(i, 10),
            toFloat: (i) => parseFloat(i),
        }
    }

    addRoute(path, handler) {
        this.routes.push({
            path,
            handler,
        })
    }

    match(path) {
        let vars = null
        let realPath = path;
        for (let i = 0; i < this.routes.length; i++) {
            let template = this.routes[i].path
            while (realPath.length > 0 && template.length > 0) {
                const varIdx = template.indexOf('{');
                // 遇到标志模板变量开始的demiliter
                // demiliter之前的部分模板与路径都是静态的应该完全相同
                if (varIdx >= 0) {
                    if (realPath.slice(0, varIdx) !== template.slice(0, varIdx)) return null
                } else {
                    if (realPath !== template) return null
                }
                // 变量名与值从字符串中提取出来，添加到映射合集
                const endVarIdx = template.indexOf('}', varIdx)
                const endSlashIdx = realPath.indexOf('/', varIdx)
                const pair = template.slice(varIdx + 1, endVarIdx).split(':')
                let converter;
                let name;
                if (pair.length > 1) {
                    converter = this.converters[ pair[0] ]
                    name = pair[1]
                } else {
                    name = pair[0]
                }

                let value;
                if (endSlashIdx < 0) {
                    value = realPath.slice(varIdx)
                } else {
                    value = realPath.slice(varIdx, endSlashIdx)
                }
                if (!vars) vars = {}
                vars[name] = converter ? converter(value) : value
                
                // 已经完成匹配的部分截取掉，重新开始匹配
                template = template.slice(endVarIdx + 1)
                realPath = endSlashIdx < 0 ? '' : realPath.slice(endSlashIdx)
            }
        }
        return vars
    }
}