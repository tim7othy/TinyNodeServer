const net = require('net')

const REQUEST_TEMPLATE = `POST /posts/42/comments HTTP/1.1\r\nHost: www.my-api.com\r\nAccept: application/json\r\nContent-Length: 3\r\n\r\naaa`

const client = new net.Socket()
client.connect(6666, '127.0.0.1', () => {
	client.write(REQUEST_TEMPLATE);
})

client.on('data', function(data) {
	console.log('Received: ' + data);
	// client.destroy(); // kill client after server's response
});

client.on('close', function() {
	console.log('Connection closed');
});
