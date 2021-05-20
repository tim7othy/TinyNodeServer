module.exports = class Response {
    constructor(socket, req) {
        this.socket = socket
        this.req = req
        this.status = 200
        this.statusText = 'OK'
        this.headersSent = false
        this.isChunked = false
        this.headers = {
            server: 'my-custom-server'
        }
    }
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    }

    sendHeaders() {
      // Only do this once :)
      if (!this.headersSent) {
        this.headersSent = true;
        // Add the date header
        this.setHeader('date', new Date().toGMTString());
        // Send the status line
        this.socket.write(`HTTP/1.1 ${this.status} ${this.statusText}\r\n`);
        // Send each following header
        Object.keys(this.headers).forEach(headerKey => {
          this.socket.write(`${headerKey}: ${this.headers[headerKey]}\r\n`);
        });
        // Add the final \r\n that delimits the response headers from body
        this.socket.write('\r\n');
      }
    }

    write(chunk) {
        if (!this.headersSent) {
            // If there's no content-length header, then specify Transfer-Encoding chunked
            if (!this.headers['content-length']) {
                this.isChunked = true;
                this.setHeader('transfer-encoding', 'chunked');
            }
            this.sendHeaders();
        }
        if (this.isChunked) {
            const size = chunk.length.toString(16);
            this.socket.write(`${size}\r\n`);
            this.socket.write(chunk);
            this.socket.write('\r\n');
        } else {
            this.socket.write(chunk);
        }
    }

    end(chunk) {
        if (!this.headersSent) {
            // We know the full length of the response, let's set it
            if (!this.headers['content-length']) {
                // Assume that chunk is a buffer, not a string!
                this.setHeader('content-length', chunk ? chunk.length : 0);
            }
            this.sendHeaders();
        }
        if (this.isChunked) {
            if (chunk) {
                const size = (chunk.length).toString(16);
                this.socket.write(`${size}\r\n`);
                this.socket.write(chunk);
                this.socket.write('\r\n');
            }
            this.socket.end('0\r\n\r\n');
        }
        else {
            this.socket.end(chunk);
        }
    }

    json(data) {
        if (this.headersSent) {
            throw new Error('Headers sent, cannot proceed to send JSON');
        }
        const json = Buffer.from(JSON.stringify(data));
        this.setHeader('content-type', 'application/json; charset=utf-8');
        this.setHeader('content-length', json.length);
        this.sendHeaders();
        this.socket.end(json);
    }
}