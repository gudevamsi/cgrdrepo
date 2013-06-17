var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = UserLoginDao;
Util.inherits(UserLoginDao, EventEmitter);
function UserLoginDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

UserLoginDao.prototype.insertUserLogin=function(userlogin){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('USER_LOGIN', 'ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("UserLoginDao.insertUserLogin():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("UserLoginDao.insertUserLogin():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('UserLoginDao.insertUserLogin():: UserLoginDao:: Successfully got connection ...'+con);
				var sql = "INSERT INTO USER_LOGIN "+
			  	"(ID, USER_ID, PASSWORD, CREATED_BY, CREATED_DATE) "+
			  	"VALUES (?, ?, ?, ?, ?)";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('UserLoginDao.insertUserLogin():: Date is: '+fdate);
				con.query(sql, [++id, userlogin.userid, userlogin.password, userlogin.createdby, fdate], function(err, result){
					if(err){
						console.log("UserLoginDao.insertUserLogin():: error: "+err);
						console.log("UserLoginDao.insertUserLogin():: Failed to insert user login details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("UserLoginDao.insertUserLogin():: Successfully inserted user login details in DB ...");
						self.emit("success", id);
						console.log("UserLoginDao.insertUserLogin():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}