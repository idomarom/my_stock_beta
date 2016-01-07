#!/bin/env node
// grab the packages we need
//  OpenShift Node application
var express = require('express');
var fs      = require('fs');
var pg 		= require('pg');
var _ 		= require('underscore');
/**
 *  Define the application.
 */
var SampleApp = function() {

	//  Scope.
	var self = this,
		address='',
		connectionString='';

	if(process.env.OPENSHIFT_NODEJS_IP) {
		address = "127.7.40.131";
		connectionString = "postgres://admint6eddde:sF1tiBB16rRk@" + address + ":5432/postgres";
	} else {
		address = "localhost"
		connectionString = "postgres://postgres:zubur1@" + address + ":5432/postgres";
	}

	console.log(connectionString);
	var client = new pg.Client(connectionString);

	/**
	 *  Set up server IP address and port # using env variables/defaults.
	 */
	self.setupVariables = function() {
		//  Set the environment variables we need.
		self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
		self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
		if (typeof self.ipaddress === "undefined") {
			//  Log errors on OpenShift but continue w/ 127.0.0.1 - this
			//  allows us to run/test the app locally.
			console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
			self.ipaddress = "127.0.0.1";
		};

		//self.createTimeZoneCorrectionStr();

		console.log("setupVariables: " + self.ipaddress);
		console.log("setupVariables: " + self.port);
	};


	/**
	 *  Populate the cache.
	 */
	self.populateCache = function() {
		if (typeof self.zcache === "undefined") {
			self.zcache = { 'index.html': ''};
		}

		//  Local cache for static content.
		self.zcache['index.html'] = fs.readFileSync('./index.html');
	};


	/**
	 *  Retrieve entry (content) from cache.
	 *  @param {string} key  Key identifying content to retrieve from cache.
	 */
	self.cache_get = function(key) { return self.zcache[key]; };


	/**
	 *  terminator === the termination handler
	 *  Terminate server on receipt of the specified signal.
	 *  @param {string} sig  Signal to terminate on.
	 */
	self.terminator = function(sig){
		if (typeof sig === "string") {
			console.log('%s: Received %s - terminating app ...',
				Date(Date.now()), sig);
			process.exit(1);
		}
		console.log('%s: Node server stopped.', Date(Date.now()) );
	};


	/**
	 *  Setup termination handlers (for exit and a list of signals).
	 */
	self.setupTerminationHandlers = function(){
		//  Process on exit and signals.
		process.on('exit', function() { self.terminator(); });

		// Removed 'SIGPIPE' from the list - bugz 852598.
		['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
			'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
		].forEach(function(element, index, array) {
				process.on(element, function() { self.terminator(element); });
			});
	};


	/*  ================================================================  */
	/*  App server functions (main app logic here).                       */
	/*  ================================================================  */

	/**
	 *  Create the routing table entries + handlers for the application.
	 */
	self.createRoutes = function() {
		self.GETroutes = { };
		self.POSTroutes = { };

		self.GETroutes['/asciimo'] = function(req, res) {
			var link = "http://i.imgur.com/kmbjB.png";
			res.send("<html><body><img src='" + link + "'></body></html>");
		};

		self.GETroutes['/'] = function(req, res) {
			console.log('/');
			res.setHeader('Content-Type', 'text/html');
			res.send(self.cache_get('index.html') );
		};

		self.POSTroutes['/login'] = function(req, res) {
			console.log('/login');
			var nick_name = req.body['nick_name'];
			var password = req.body['password'];

			var queryStr = 'SELECT id FROM public.user where nick_name=\'' + nick_name + '\' and password=\'' + password + '\'';
			return self.runQuery ([].concat(queryStr),res);
		};

		self.POSTroutes['/stock/get'] = function(req, res) {
			console.log('/stock/get');
			var user_id = req.body['user_id'];
			if(user_id === undefined) {
				var err = "could not find user_id parameter";
				console.log(err);
				return res.status(500).json({ success: false, data: err});
			}

			console.log('here1');
			var queryStr = 'SELECT symbol,date AT TIME ZONE \'UTC\',buy_price,amount,user_id,sell_price from public.stock as stk where user_id='+user_id + ' ORDER BY symbol,date,buy_price';
			return self.runQuery ([].concat(queryStr),res);
		};

		self.POSTroutes['/stock/add'] = function(req, res) {
			console.log('/stock/add');
			var symbol = req.body['symbol'];
			var dateObj = new Date(req.body['date']);
			dateObj.setUTCHours(0,0,0,0);
			var date = dateObj.toISOString();
			console.log ("/stock/add: " + req.body['date']);
			console.log ("/stock/add: " + date);
			var buyPrice = req.body['buyPrice'];
			var sellPrice = req.body['sellPrice'];
			var amount = req.body['amount'];
			var user_id = req.body['user_id'];

			//if(symbol === undefined || date === undefined || price === undefined || amount === undefined || user_id === undefined) {
			//	var err = "could not get all parameter";
			//	console.log(err);
			//	return res.status(500).json({ success: false, data: err});
			//}


			var queryStr = 'INSERT INTO public.stock(symbol, date, buy_price, amount, user_id,sell_price) VALUES ( \'' + symbol + "\'" + ","+ " TIMESTAMP \'" + date + "\'" +" AT TIME ZONE 'UTC' ," + buyPrice  +","+ amount  +","+ user_id + "," + sellPrice + ")";
			return self.runQuery ([].concat(queryStr),res);
		};

		self.POSTroutes['/stock/sell'] = function(req, res) {
			console.log('/stock/sell');
			var symbol = req.body['symbol'];
			var dateObj = new Date(req.body['date']);
			dateObj.setUTCHours(0,0,0,0);
			var date = dateObj.toISOString();
			console.log ("/stock/sell: " + req.body['date']);
			console.log ("/stock/sell: " + date);
			var buyPrice = req.body['buyPrice'];
			var sellPrice = req.body['sellPrice'];
			var amount = req.body['amount'];
			var user_id = req.body['user_id'];

			//if(symbol === undefined || date === undefined || price === undefined || amount === undefined || user_id === undefined) {
			//	var err = "could not get all parameter";
			//	console.log(err);
			//	return res.status(500).json({ success: false, data: err});
			//}
			var queryStr = 'UPDATE public.stock SET sell_price=' + sellPrice + ' WHERE user_id=' + user_id + ' and symbol=\'' + symbol + '\' and buy_price=' + buyPrice + ' and amount=' + amount + ' and date=TIMESTAMP \'' + date + '\' AT TIME ZONE \'UTC\'';
			return self.runQuery ([].concat(queryStr),res);
		};

		self.POSTroutes['/stock/delete'] = function(req, res) {
			console.log('/stock/delete');
			var data = req.body;
			var user_id = data['user_id'];
			var stock = JSON.parse(data['stock']);

			var queryArr=[];
			var len = stock.length;
			for (var i =0; i < len; ++i) {
				var symbol = stock[i]['symbol'];
				var dateObj = new Date(stock[i]['date']);
				dateObj.setUTCHours(0,0,0,0);
				var date = dateObj.toISOString();
				var buyPrice = stock[i]['buyPrice'];
				var sellPrice = stock[i]['sellPrice'];
				var amount = stock[i]['amount'];
				//if (_.isEmpty(symbol) || _.isEmpty(date) || _.isEmpty(buyPrice) || _.isEmpty(amount) ||  _.isEmpty(user_id)) {
				//	var err = "could not get all parameter";
				//	console.log(err);
				//	return res.status(500).json({success: false, data: err});
				//}

				console.log ("/stock/delete: symbol: " + symbol + " date:" + date);

				var queryStr = 'DELETE FROM public.stock WHERE user_id=' + user_id + ' and symbol=\'' + symbol + '\' and buy_price=' + buyPrice + ' and sell_price=' + sellPrice + ' and amount=' + amount + ' and date=TIMESTAMP \'' + date + '\' AT TIME ZONE \'UTC\'';
				console.log('/stock/delete query: ' + queryStr);
				queryArr.push(queryStr);
			}

			self.runQuery(queryArr, res);

			return;
		};
	};

	self.runQuery= function (queryArr, res) {
		console.log('here2');

		if(queryArr.empty) {
			console.log("runQuery: empty array");
			return;
		}

		var results = [];
		var len = queryArr.length;
		var sendOnlyLastResponse = (len > 1);
		var queryCounter = 0;
		var queryResponseCounter = 0;
		for(var i=0; i < len; ++i) {
			// Get a Postgres client from the connection pool
			pg.connect(connectionString, function (err, client, done) {
				// Handle connection errors
				if (err) {
					console.log("error on pg db connection");
					done();
					console.log(err);
					return !res || res.status(500).json({success: false, data: err});
				}

				var queryStr = queryArr[queryCounter++];
				var query = client.query(queryStr);

				// Stream results back one row at a time
				query.on('error', function (err) {
					console.log("error on query: " + this.text);
					console.log('here3 error');
					console.log(err);
					return !res || res.status(500).json({success: false, data: err});
				});

				if (res) {
					query.on('row', function (row) {
						if(_.has(row,"timezone")) {
							row.date=row.timezone;
							//row.date.setHours(0,0,0,0);
							//console.log('here4.1 row:' + row.date.toString());
							//row.date = self.convertDateToUTC(row.date);
							//console.log('here4.2 row:' + row.date.toString());
							////row.date.setHours(0,0,0,0);
							//console.log('here4.3 row:' + row.date.toString());
						}

						console.log ("row: symbol: " + row.symbol + " date:" + row.date);
						results.push(row);
					});
				}

				// After all data is returned, close connection and return results
				query.on('end', function () {
					console.log("end of query: " + this.text);
					console.log('here5 end');
					done();
					++queryResponseCounter;
					if (sendOnlyLastResponse) {
						if(queryResponseCounter == len)
							return !res || res.json(results);
					} else { //return on every request
						return !res || res.json(results);
					}
				});
			});

		}
	}

	/**
	 *  Initialize the server (express) and create the GETroutes and register
	 *  the handlers.
	 */
	self.initializeServer = function() {
		self.createRoutes();
		self.app = express();
		var bodyParser = require('body-parser');
		self.app.use(bodyParser.json()); // support json encoded bodies
		self.app.use(bodyParser.urlencoded({	extended: true })); // support encoded bodies

		//  Add handlers for the app (from the GETroutes).
		for (var r in self.GETroutes) {
			self.app.get(r, self.GETroutes[r]);
		}

		for (var r in self.POSTroutes) {
			self.app.post(r, self.POSTroutes[r]);
		}
	};

	/**
	 *  Initializes the application.
	 */
	self.initialize = function() {
		self.setupVariables();
		self.populateCache();
		self.setupTerminationHandlers();
		//self.initDatabase();
		// Create the express server and GETroutes.
		self.initializeServer();
	};


	/**
	 *  Start the server (starts up the application).
	 */
	self.start = function() {
		//  Start the app on the specific interface (and port).
		self.app.listen(self.port, self.ipaddress, function() {
			console.log('%s: Node server started on %s:%d ...',
				Date(Date.now() ), self.ipaddress, self.port);
		});
	};



};   /*  Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

