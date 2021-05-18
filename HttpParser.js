const ParserState = {
    HEADER: 1,
    REQUEST_LINE: 2,
    RESPONSE_LINE: 3,
    HEADER_LINE: 4,
    BODY_RAW: 5,
}
// 正在解析HTTP报文Header部分的状态集合
const HeaderStateSet = new Set([ParserState.HEADER, ParserState.REQUEST_LINE, ParserState.RESPONSE_LINE])
// 可以完成解析的状态集合
const FinishAllowSet = new Set([ParserState.REQUEST_LINE, ParserState.RESPONSE_LINE, ParserState.BODY_RAW])

class HttpParser {
    constructor(options) {
        this.state = options.state || ParserState.HEADER
        this.maxHeaderSize = options.maxHeaderSize || 80 * 1024
        this.headerSize = 0
        this.line = ''
        this.encoding = options.encoding || 'utf-8'
    }

    execute(chunk, start, length) {
        // 当前正在解析的片段
        this.chunk = chunk;
        // 解析到当前片段的偏移位置
        this.offset = start || 0;
        // 待解析片段的结尾位置
        this.end = start + typeof length === 'number' ? length : chunk.length;
        while (this.offset < end) {
            // 根据状态获取解析函数并调用，根据解析返回的信号进行下一步操作
            const signal = this[this.state]()
            if (signal === 1) {
                // 停止解析
                break;
            }
        }

        this.chunk = null;
        const len = this.offset - start;
        if (HeaderStateSet.has(this.state)) {
            // 解析请求头不能超出限制
            this.headerSize += len;
            if (this.headerSize > this.maxHeaderSize) {
                return new Error('max header size exceeded');
            }
        }
        // 返回解析的长度，便于调用函数判断是否解析完整
        return len;
    }

    consumeLine() {
        for (let i = this.offset; i < this.end; i++) {
            if (this.chunk[i] === 0x0a /* \n */) {
                // this.line 是上一次执行execute剩余没解析完的行
                const line = this.line + chunk.toString(this.encoding, this.offset, i);
                if (line.charAt(line.length - 1) === '\r') {
                  line = line.substr(0, line.length - 1);
                }
                this.line = '';
                this.offset = i + 1;
                return line;
            }
        }

        // 没有找到换行符，说明chunk的数据从一行中间断开了
        // 保存当前解析的数据作为这一行的前半部分
        // 下一次执行execute解析随后的chunk数据时，将后半部分拼接上来
        this.line = this.chunk.toString(this.encoding, this.offset, this.end)
        // 数据保存下来也算解析完了
        this.offset = this.end;
    }

    HEADER() {

    }

    REQUEST_LINE() {

    }

    RESPONSE_LINE() {

    }

    HEADER_LINE() {

    }

    BODY_RAW() {

    }
}

