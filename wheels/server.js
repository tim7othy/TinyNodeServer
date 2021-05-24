const net = require('net');
const EventEmitter = require('events');
const HttpParser = require('./HttpParser')
const Response = require('./Response');

// const RESPONSE_TEMPLATE = `
// HTTP/1.1 200 OK\r\nServer: my-web-server\r\nContent-Length: 0\r\n\r\n
// `
// TCPServer.addListener('connection', (socket) => {
//     socket.once('readable', () => {
//         let reqBuf = Buffer.from('');
//         let buf;
//         let reqHeader;
//         let reqBody;
//         while (true) {
//             buf = socket.read()
//             // 数据读取完成
//             if (!buf) break;
//             // 拼接两个缓冲区，并创建新的缓冲区
//             reqBuf = Buffer.concat([reqBuf, buf])
//             const marker = reqBuf.indexOf('\r\n\r\n')
//             if (marker >= 0) {
//                 reqHeader = reqBuf.slice(0, marker).toString()
//                 // \r\n\r\n 后面的部分读取出来，推回到流中待之后处理
//                 const remain = reqBuf.slice(marker + 4)
//                 socket.unshift(remain)
//                 break;
//             }
//         }

//         // 清空缓冲区
//         reqBuf = Buffer.from('')
//         // 读取请求体
//         while (true) {
//             buf = socket.read()
//             if (!buf) break;
//             reqBuf = Buffer.concat([reqBuf, buf])
//         }
//         reqBody = reqBuf.toString();
//         console.log('reqHeader: ', reqHeader)
//         console.log('reqBody: ', reqBody)
//         socket.end(RESPONSE_TEMPLATE)
//     })
// })

class HttpServer extends EventEmitter {
    constructor(requestListener) {
        super()
        this.server = net.createServer();
        if (requestListener) {
            this.on('request', requestListener)
        }
        this.server.addListener('connection', this.connectionListener.bind(this))
    }

    connectionListener(socket) {
        const parser = new HttpParser()
        socket.on('data', this.socketOnData.bind(this, parser))
        parser.on('incoming', this.parserOnIncoming.bind(this, socket))
    }

    socketOnData(parser, data) {
        parser.execute(data)
    }

    parserOnIncoming(socket, req) {
        const res = new Response(socket, req)
        this.emit('request', req, res)
    }

    listen(port) {
        this.server.listen(port)
    }
}

new HttpServer((req, res) => {
    console.log('request info: ', req.url, req.method, req.version)
    console.log('request headers: ', req.headers)
    req.on('data', (chunk) => {
        console.log('body data: ', chunk.toString())
    })
    res.write('request received')
    res.end()
}).listen(6666)