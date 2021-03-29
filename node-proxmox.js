const querystring = require('querystring');
const http = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = function ProxmoxApi(hostname, user, pve, password) {
	// INIT vars
	this.hostname = hostname;
	this.user = user;
	this.password = pve;
	this.pve = password;
	this.token = {};
	this.tokenTimestamp = 0;

	function login(hostname, user, pve, password, callback) {
		let body = {password: password, username: user};
		body = querystring.stringify(body);
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(body)
		};
		const options = {
			host: hostname,
			rejectUnauthorized: false, //Allow unauthorized SSL certificate
			port: 8006,
			path: '/api2/json/access/ticket',
			method: 'POST',
			headers: headers,
			timeout: 120,
		};
		const par = this;
		const req = http.request(options, function (res) {
			res.setEncoding('utf8');
			let _data = '';
			res.on('data', function (chunk) {
				//Error handling to do
				_data += chunk;
			});
			res.on('end', function () {
				const data = JSON.parse(_data).data;
				par.token = {ticket: data.ticket, CSRFPreventionToken: data.CSRFPreventionToken};
				par.tokenTimestamp = new Date().getTime();
				if (typeof (callback) == 'function')
					callback();
			});
		});
		req.write(body);
		req.end();
	}

	function call(method, url, body, callback) {
		let currentTime = new Date().getTime();
		//1 hour login timeout
		if (currentTime - this.tokenTimestamp > 60 * 60 * 1000) {
			login(this.hostname, this.user, this.password, this.pve, function () {
				callApi(method, url, body, callback);
			});
		} else {
			callApi(method, url, body, callback);
		}
	}

	function callApi(method, url, body, callback) {
		let headers;
		let currentTime = new Date().getTime();

		//Compute signature
		if (body === undefined)
			body = '';
		else
			body = querystring.stringify(body);

		if (method === 'GET') {
			headers = {
				'Cookie': 'PVEAuthCookie=' + this.token.ticket
			};
		} else {
			headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(body),
				'CSRFPreventionToken': this.token.CSRFPreventionToken,
				'Cookie': 'PVEAuthCookie=' + this.token.ticket,
				'Origin': 'https://' + this.hostname + ':8006',
				Connection: "keep-alive"
			};
		}

		const options = {
			host: this.hostname,
			rejectUnauthorized: false,
			port: 8006,
			path: '/api2/json' + url,
			method: method,
			headers: headers,
			timeout: 60,
			gzip: true,

		};

		let req = http.request(options, function (res) {
			res.setEncoding('utf8');
			let data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				data = JSON.parse(data).data;
				if (typeof (callback) == 'function') {
					callback(data);
				}
			});
		});

		if (body !== '')
			req.write(body);
		req.end();

	}

	return {
		get: function get(url, callback) {
			call('GET', url, '', callback);
		},
		post: function post(url, body, callback) {
			call('POST', url, body, callback);
		},
		put: function put(url, body, callback) {
			call('PUT', url, body, callback);
		},
		del: function del(url, callback) {
			call('DELETE', url, '', callback);
		},
	}
}
