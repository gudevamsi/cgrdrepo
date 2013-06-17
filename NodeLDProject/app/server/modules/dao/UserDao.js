var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");
var user = require('../model/user');

module.exports = UserDao;
Util.inherits(UserDao, EventEmitter);
function UserDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

UserDao.prototype.insertUser=function(user){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('USER', 'ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("UserDao.insertUser():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("UserDao.insertUser():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('UserDao.insertUser():: userdao:: Successfully got connection ...'+con);
				var sql = "INSERT INTO USER "+
			  	"(ID, USER_ID, FIRST_NAME, LAST_NAME, DESIGNATION, MANAGER, ACTIVE, ROLE, CREATED_BY, CREATED_DATE) "+
			  	"VALUES (?, ?, ?, ?, ?, (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), ?, ?, ?, ?)";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('UserDao.insertUser():: Date is: '+fdate);
				con.query(sql, [++id, user.userid, user.firstname, user.lastname, user.designation, user.managerid, "Y", user.role, user.createdby, fdate], function(err, result){
					if(err){
						console.log("UserDao.insertUser():: error: "+err);
						console.log("UserDao.insertUser():: Failed to insert user details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("UserDao.insertUser():: Successfully inserted user details in DB ...");
						self.emit("success", id);
						console.log("UserDao.insertUser():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

UserDao.prototype.updateUser = function(user){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserDao.updateUser():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserDao.updateUser():: Successfully got database connection ...");
			var date = new Date();
			var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	
			var sql = "UPDATE USER SET FIRST_NAME=?, LAST_NAME=?, DESIGNATION=?, MANAGER=(SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), ROLE=?, UPDATED_BY=?, UPDATED_DATE=? WHERE USER_ID=?";
			con.query(sql, [user.firstname, user.lastname, user.designation, user.manageruserid, user.role, user.updatedby, fdate, user.userid], function(err, results){
				if(err){
					console.error("UserDao.updateUser():: Error occurred while updating user details ... Error is: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('UserDao.updateUser():: Successfully updated user details ...'+results);
					self.emit("success");
					console.log('UserDao.updateUser():: Successfully emitted success event ...');
					con.end();
				}
			});
		}
	});
}

UserDao.prototype.deleteUserById = function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserDao.deleteUser():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserDao.deleteUser():: Successfully got database connection ...");
			var sql = "UPDATE USER SET ACTIVE='N' WHERE ID=?";
			con.query(sql, [id], function(err, result){
				if(err){
					console.error("UserDao.deleteUser():: Error occurred while updating active flag for id("+id+") ... Error is: "+err);
					self.emit("error", err);
				}
				else{
					console.log("UserDao.deleteUser():: Successfully updated active flag in databse for id: "+id);
					self.emit("success");
					console.log("UserDao.deleteUser():: Successfully emitted success event ...");
				}
			});
		}
	});
}

UserDao.prototype.getAllUsers = function(){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserDao.getAllUsers():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserDao.getAllUsers():: Successfully got the db connection ...");
			var sql = "SELECT U.ID, U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.ROLE, M.ID AS MANAGER, M.USER_ID AS MANAGERID, D.NAME AS DESIGNATION FROM USER U LEFT JOIN USER M ON U.MANAGER=M.ID, DESIGNATION D WHERE U.DESIGNATION=D.DESIGNATION_ID AND U.ACTIVE='Y'";
			con.query(sql, [], function(err, results){
				if(err){
					console.log("UserDao.getAllUsers():: Error occurred while retriving all user details... Error: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log("UserDao.getAllUsers():: successfully executed the query ..."+results.length);
					var arr = new Array();
					for(var i=0; i<results.length; i++){
						var result = results[i];
						var u = new user.User(result);
						arr[i]=u;
					}
					self.emit("success", arr);
					console.log("UserDao.getAllUsers():: successfully emitted success event...");
					con.end();
				}
			});
		}
	});
}

UserDao.prototype.getUsersByProjectId = function(projectid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserDao.getUsersByProjectId():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserDao.getUsersByProjectId():: Successfully got the db connection ...");
			var sql = "SELECT UP.USER_ID AS ID,U.USER_ID AS USER_ID,U.FIRST_NAME FIRST_NAME,U.LAST_NAME LAST_NAME FROM USER_PROJECT AS UP LEFT JOIN USER U ON UP.USER_ID = U.ID AND U.ACTIVE='Y' WHERE UP.PROJECT_ID = ?";
			con.query(sql, [projectid], function(err, results){
				if(err){
					console.log("UserDao.getUsersByProjectId():: Error occurred while retriving all user details... Error: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log("UserDao.getUsersByProjectId():: successfully executed the query ..."+results.length);
					var arr = new Array();
					for(var i=0; i<results.length; i++){
						var result = results[i];
						var u = new user.User(result);
						arr[i]=u;
					}
					self.emit("success", arr);
					console.log("UserDao.getUsersByProjectId():: successfully emitted success event...");
					con.end();
				}
			});
		}
	});
}

UserDao.prototype.getReportedUsers = function(mgrid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserDao.getReportedUsers():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserDao.getReportedUsers():: Successfully got the db connection ...");
			var sql = "SELECT * FROM USER WHERE MANAGER=? AND ACTIVE = 'Y' ORDER BY FIRST_NAME";
			con.query(sql, [mgrid], function(err, results){
				if(err){
					console.log("UserDao.getReportedUsers():: Error occurred while retriving reported details... Error: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log("UserDao.getReportedUsers():: successfully executed the query ..."+results.length);
					var arr = new Array();
					for(var i=0; i<results.length; i++){
						var result = results[i];
						var u = new user.User(result);
						arr[i]=u;
					}
					self.emit("success", arr);
					console.log("UserDao.getReportedUsers():: successfully emitted success event...");
					con.end();
				}
			});
		}
	});
}