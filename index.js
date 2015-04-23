let http = require('http')
let fs = require('fs')
let request = require('request')
let through = require('through')
let argv = require('yargs')
	.default('host', 'localhost.homeoffice.wal-mart.com')
	.argv
let scheme = 'http://'
let port = argv.port || argv.host === 'localhost.homeoffice.wal-mart.com' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout

http.createServer((req, res) => {
	logStream.write('\nEcho request:\n' + JSON.stringify(req.headers))
	for (let header in req.headers) {
		res.setHeader(header, req.headers[header])
	}
	through(req, logStream, {autoDestroy: false})
	req.pipe(res)
}).listen(8000)

logStream.write('Echo server listening at http://localhost.homeoffice.wal-mart.com:8000\n')

http.createServer((req, res) => {
	let url = destinationUrl
	if (req.headers['x-destination-url']) {
		url = req.headers['x-destination-url']
	}
	let options = {
		headers: req.headers,
		url: url + req.url
	}

	logStream.write('\nProxy request:\n' + JSON.stringify(req.headers))
	through(req, logStream, {autoDestroy: false})

	let destinationResponse = req.pipe(request(options))
	logStream.write(JSON.stringify(destinationResponse.headers))
	destinationResponse.pipe(res)
	through(destinationResponse, logStream, {autoDestroy: false})
}).listen(8001)

logStream.write('Proxy server listening at http://localhost.homeoffice.wal-mart.com:8001\n')