const net = require('net')
const TCPServer = net.createServer()

const RESPONSE_TEMPLATE = `
HTTP/1.1 200 OK\r\nServer: my-web-server\r\nContent-Length: 0\r\n\r\n
`
TCPServer.addListener('connection', (socket) => {
    socket.once('readable', () => {
        let reqBuf = Buffer.from('');
        let buf;
        let reqHeader;
        let reqBody;
        while (true) {
            buf = socket.read()
            // 数据读取完成
            if (!buf) break;
            // 拼接两个缓冲区，并创建新的缓冲区
            reqBuf = Buffer.concat([reqBuf, buf])
            const marker = reqBuf.indexOf('\r\n\r\n')
            if (marker >= 0) {
                reqHeader = reqBuf.slice(0, marker).toString()
                // \r\n\r\n 后面的部分读取出来，推回到流中待之后处理
                const remain = reqBuf.slice(marker + 4)
                socket.unshift(remain)
                break;
            }
        }

        // 清空缓冲区
        reqBuf = Buffer.from('')
        // 读取请求体
        while (true) {
            buf = socket.read()
            if (!buf) break;
            reqBuf = Buffer.concat([reqBuf, buf])
        }
        reqBody = reqBuf.toString();
        console.log('reqHeader: ', reqHeader)
        console.log('reqBody: ', reqBody)
        socket.end(RESPONSE_TEMPLATE)
    })
})

TCPServer.listen(6666, '127.0.0.1')