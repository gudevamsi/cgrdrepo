var constants = require('./constants');
var mysql = require('mysql');

exports.getConnectionPool = function(){ 
	console.log('MySQLDBConnectionPoll.getConnectionPool():: Connecting to MySQL Database using hostname: '+constants.hostname+', database: '+constants.database+', port: '+constants.port+', username: '+constants.username+' ...');
	try{		
		conpool = mysql.createPool({
			user 		: constants.username,
			password 	: constants.password,
			host 		: constants.hostname,
			database 	: constants.database,
			port 		: constants.port
		});
		//console.log(conpool);
		return conpool;
	}catch(error){
		console.log('MySQLDBConnectionPoll.getConnectionPool():: Error: '+error);
	}
}