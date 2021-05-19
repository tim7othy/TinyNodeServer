const ParserState = {
    REQUEST_LINE: 1,
    RESPONSE_LINE: 2,
    HEADER_LINE: 3,
    BODY_RAW: 4,
    BODY_CHUNKHEAD: 5,
    BODY_CHUNKDATA: 6,
    BODY_CHUNKFOOTER: 7,
    BODY_SIZED: 8,
}
const ParserSignal = {
    SIGNAL_NORMAL: 0,
    SIGNAL_STOP: 1, // 停止继续解析
}
// 正在解析HTTP报文Header部分的状态集合
const HeaderStateSet = new Set([ParserState.HEADER_LINE, ParserState.REQUEST_LINE, ParserState.RESPONSE_LINE])
// 可以完成解析的状态集合
const FinishAllowSet = new Set([ParserState.REQUEST_LINE, ParserState.RESPONSE_LINE, ParserState.BODY_RAW])

module.exports = class HttpParser {
    constructor(options={}) {
        this.type = options.type || 'request'
        this.state = this.type === 'request' ? ParserState.REQUEST_LINE : ParserState.RESPONSE_LINE
        this.maxHeaderSize = options.maxHeaderSize || 80 * 1024
        this.headerSize = 0
        this.line = ''
        this.encoding = options.encoding || 'utf-8'
        this.info = {}
        this.callbacks = {}
        this.signal = ParserSignal.SIGNAL_NORMAL // 
    }

    on(ev, cb) {
        this.callbacks[ev] = cb
    }

    execute(chunk, start, length) {
        // 当前正在解析的片段
        this.chunk = chunk;
        // 解析到当前片段的偏移位置
        this.offset = start || 0;
        // 待解析片段的结尾位置
        this.end = start + typeof length === 'number' ? length : chunk.length;
        while (this.offset < end) {
            if (this.signal === ParserSignal.SIGNAL_STOP) {
                break;
            }
            // 根据状态获取解析函数并调用，根据解析返回的信号进行下一步操作
            this[this.state]()
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
                const line = this.line + this.chunk.toString(this.encoding, this.offset, i);
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

    normalizeLine(line) {
        if (line === undefined || line === null) return ''
        return line
            .replace(/^\s+|\s+$/g, '') // 去除行两侧的空格
            .replace(/\s+/g, ' ') // 多个空格转换为一个空格，方便后续用空格进行切分
    }

    parseRequestLine(line) {
        const [method, path, version] = this.normalizeLine(line).split(' ')
        if (method && path && version) {
            this.info = {
                ...this.info,
                method,
                path,
                version,
            }
        } else {
            throw new Error('解析请求行错误！')
        }
    }

    parseResponseLine(line) {
        const [version, statusCode, statusStr] = this.normalizeLine(line).split(' ')
        if (version && statusCode && statusStr) {
            this.info = {
                ...this.info,
                version,
                statusCode,
                statusStr,
            }
        } else {
            throw new Error('解析响应行错误！')
        }
    }

    parseHeaderLine(line) {
        const [k, v] = this.normalizeLine(line).split(': ')
        if (k && v) {
            this.info.headers[k] = v
        }
    }

    nextStateFromHeaders() {
        const headerKeys = Object.keys(this.info.headers)
        for (let i = 0; i < headerKeys.length; i++) {
            const k = headerKeys[i];
            const v = this.info.headers[k];
            switch (k.toLowerCase()) {
                case 'transfer-encoding':
                    this.isChunked = v.toLowerCase() === 'chunked';
                    break;
                case 'content-length':
                    this.hasContentLength = true;
                    this.bodyByteLength = parseInt(v, 10)
                default:
                    break;
            }
        }
        
        if (this.isChunked) {
            this.state = ParserState.BODY_CHUNKHEAD
        } else if (this.hasContentLength) {
            this.state = ParserState.BODY_SIZED
        } else {
            this.state = ParserState.BODY_RAW
        }
    }

    REQUEST_LINE() {
        const line = this.consumeLine()
        // 没有读取到一行
        if (line === undefined || line === null) return;
        this.parseRequestLine(line)
        // 转移到解析请求头部行的状态
        this.state = ParserState.HEADER_LINE
    }

    RESPONSE_LINE() {
        const line = this.consumeLine()
        // 没有读取到一行
        if (line === undefined || line === null) return;
        this.parseResponseLine(line)
        // 转移到解析响应头部行的状态
        this.state = ParserState.HEADER_LINE
    }

    HEADER_LINE() {
        const line = this.consumeLine()
        // 没有读取到一行
        if (line === undefined || line === null) return;
        if (line) {
            // 不为空行，解析完下个状态仍然是HEADER_LINE
            this.parseHeaderLine(line)
            this.state = ParserState.HEADER_LINE
        } else {
            // 空行，代表请求头解析完成
            // 从请求头信息中获取下一个状态
            this.nextStateFromHeaders()
        }
    }

    BODY_CHUNKHEAD() {
        const line = this.consumeLine()
        // 没有读取到一行
        if (line === undefined || line === null) return;
        // 读取16进制的chunk体大小
        this.bodyByteLength = parseInt(line, 16)
        if (!this.bodyByteLength) {
            // chunk大小为0，读取到最后一个chunk块的状态
            this.state = ParserState.BODY_CHUNKFOOTER
        } else {
            this.state = ParserState.BODY_CHUNKDATA
        }
    }

    BODY_CHUNKDATA() {
        // 可能TCP分包将HTTP中的chunk分隔开了，一次读取不了全部的chunk
        const sizeToRead = Math.min(this.end - this.offset, this.bodyByteLength);
        // 触发回调处理chunk数据
        this.callbacks['onChunkData'](this.chunk, this.offset, sizeToRead)
        this.offset += sizeToRead;
        this.bodyByteLength -= sizeToRead;
        // 当前chunk体读完了，接着读取下一个
        if (!this.bodyByteLength) {
            // 有的实现中chunk之间由空行分隔，这里为了简便省略
            this.state = ParserState.BODY_CHUNKHEAD
        }
    }

    BODY_CHUNKFOOTER() {
        // 这里可能出现请求头，这里为了简便省略
        this.callbacks['onComplete']()
        // 结束解析
        this.offset = this.end;
    }
 
    BODY_SIZED() {
        const sizeToRead = Math.min(this.end - this.offset, this.bodyByteLength);
        // 触发回调处理body的一块数据
        this.callbacks['onBodyData'](this.chunk, this.offset, sizeToRead)
        this.offset += length;
        this.bodyByteLength -= length;
        // 解析完成
        if (!this.bodyByteLength) {
            this.callbacks['onComplete']()
            this.offset = this.end;
        }      
    }

    BODY_RAW() {
        const sizeToRead = this.end - this.offset;
        this.callbacks['onRawData'](this.chunk, this.offset, sizeToRead)
        // 直接读取完成
        this.offset = this.end;   
    }
}

