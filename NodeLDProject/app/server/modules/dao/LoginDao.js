var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");

module.exports = LoginDao;
Util.inherits(LoginDao, EventEmitter);
function LoginDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

LoginDao.prototype.authenticate=function(username, password){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("LoginDao.authenticate():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
		}
		else{
			try{
				console.log('LoginDao.authenticate():: Successfully got connection ...'+con);
				console.log('LoginDao.authenticate():: Executing SQL query to check whether user id valid user or not ...');
				
				var sql = 'SELECT U.ID, U.USER_ID, U.FIRST_NAME, U.LAST_NAME, D.NAME AS DESIGNATION, U.MANAGER, U.ROLE FROM USER U, USER_LOGIN UL, DESIGNATION D '+
						  'WHERE U.ID=UL.USER_ID AND U.USER_ID=? AND D.DESIGNATION_ID = U.DESIGNATION AND UL.PASSWORD=? AND U.ACTIVE="Y"';
				
				con.query(sql, [username, password], function(err, result){
					if(err){
						logger.error('LoginDao.authenticate():: Error occurred while executing query ... error: '+err);
						self.emit("error", err);
					}
					else{
						console.log('LoginDao.authenticate():: Successfully executed the query ... ');
						if(result==undefined || result.length <=0){
							console.log('LoginDao.authenticate():: Username or password is invalid ...');
							self.emit("invaliduser");
						}
						else{
							console.log('LoginDao.authenticate():: User is valid user ...');
							var res = result[0];				
							var u = new user.User(res);								
							self.emit("validuser", u);
							console.log('LoginDao.authenticate():: Emitted valid user ...');
						}
					}
				});
			}finally{
				con.end();
			}
		}
	});
}

LoginDao.prototype.getUserById=function(id, userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("LoginDao.getUserById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
		}
		else{
			try{
				console.log('LoginDao.getUserById():: Successfully got connection ...'+con);
				console.log('LoginDao.getUserById():: Executing SQL query to retrieve userid('+userid+') details ...');
				
				var sql = "";
				if(id==null){				
					sql = "SELECT U.ID, U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.ROLE, M.ID AS MANAGER, M.USER_ID AS MANAGERID, D.NAME AS DESIGNATION FROM USER U LEFT JOIN USER M ON U.MANAGER=M.ID, DESIGNATION D WHERE U.DESIGNATION=D.DESIGNATION_ID AND U.ACTIVE='Y' AND U.USER_ID=?";
				}
				else{
					userid = id;
					sql = "SELECT U.ID, U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.ROLE, M.ID AS MANAGER, M.USER_ID AS MANAGERID, D.NAME AS DESIGNATION FROM USER U LEFT JOIN USER M ON U.MANAGER=M.ID, DESIGNATION D WHERE U.DESIGNATION=D.DESIGNATION_ID AND U.ACTIVE='Y' AND U.ID=?";
				}
				
				con.query(sql, [userid], function(err, results){
					if(err){
						logger.error('LoginDao.getUserById():: Error occurred while executing query ... error: '+err);
						self.emit("error", err);
					}
					else{
						console.log('LoginDao.getUserById():: Successfully executed the query ... ');
						if(results.length <=0){
							console.log('LoginDao.getUserById():: Userid is not valid...');
							self.emit("notexist");
						}
						else{
							console.log('LoginDao.getUserById():: Userid exist ...');
							var result = results[0];				
							var usr = new user.User(result);								
							self.emit("exist", usr);
							console.log('LoginDao.getUserById():: Emitted valid user ...');
						}
					}
				});
			}finally{
				con.end();	
			}	
		}
	});
}

LoginDao.prototype.isUserIdExist=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("LoginDao.isUserIdExist():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
		}
		else{
			try{
				console.log('LoginDao.isUserIdExist():: Successfully got connection ...'+con);
				console.log('LoginDao.isUserIdExist():: Executing SQL query to check whether user id('+userid+') valid user or not ...');
				
				var sql = 'SELECT * FROM USER WHERE USER_ID=? AND ACTIVE="Y"';
				
				con.query(sql, [userid], function(err, result){
					if(err){
						logger.error('LoginDao.isUserIdExist():: Error occurred while executing query ... error: '+err);
						self.emit("error", err);
					}
					else{
						console.log('LoginDao.isUserIdExist():: Successfully executed the query ... ');
						if(result==undefined || result.length <=0){
							console.log('LoginDao.isUserIdExist():: Userid not exist ...');
							self.emit("notexist");
						}
						else{
							console.log('LoginDao.isUserIdExist():: User is exist ...');
							var res = result[0];				
							var u = new user.User(res);								
							self.emit("exist", u);
							console.log('LoginDao.isUserIdExist():: Emitted valid user ...');
						}
					}
				});
			}finally{
				con.end();	
			}
		}
	});
}