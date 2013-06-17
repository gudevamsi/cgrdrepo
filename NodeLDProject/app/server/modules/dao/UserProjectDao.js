var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");
module.exports = UserProjectDao;
var userproject = require('../model/userproject');




Util.inherits(UserProjectDao, EventEmitter);
function UserProjectDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

UserProjectDao.prototype.insertUserProject=function(userProject){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('USER_PROJECT', 'ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("UserProjectDao.insertUser():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("UserProjectDao.insertUser():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('UserProjectDao.insertUseProject():: userProjectdao:: Successfully got connection ...'+con);
				var sql = "INSERT INTO USER_PROJECT "+
			  	"(id,user_id,project_id,role,start_date,end_date,created_by,updated_by,updated_date) "+
			  	"VALUES (?, ?, ?, ?, ?,?, (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), ?)";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('UserDao.insertUser():: Date is: '+fdate);
				con.query(sql, [++id, userProject.userId, userProject.projectId, userProject.projectRole, userProject.startDate, userProject.toDate, userProject.createdby, userProject.updatedBy, fdate], function(err, result){
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

UserProjectDao.prototype.isUserTagged=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("UserProjectDao.isUserTagged():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
		}
		else{
			try{
				console.log('UserProjectDao.isUserTagged():: Successfully got connection ...'+con);
				console.log('UserProjectDao.isUserTagged():: Executing SQL query to check whether user id('+userid+') valid user or not ...');
				
				var sql = 'SELECT * FROM USER_PROJECT WHERE USER_ID=? AND CURDATE() < end_date';
				
				con.query(sql, [userid], function(err, result){
					if(err){
						logger.error('UserProjectDao.isUserTagged():: Error occurred while executing query ... error: '+err);
						self.emit("error", err);
					}
					else{
						console.log('UserProjectDao.isUserTagged():: Successfully executed the query ... ');
						if(result==undefined || result.length <=0){
							console.log('UserProjectDao.isUserTagged():: Userid not exist ...');
							self.emit("notexist");
						}
						else{
							console.log('UserProjectDao.isUserTagged():: User is exist ...');
														
							self.emit("exist");
							console.log('UserProjectDao.isUserTagged():: Emitted valid user ...');
						}
					}
				});
			}finally{
				con.end();	
			}
		}
	});
}

UserProjectDao.prototype.getAllUserProject = function(){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserProjectDao.getAllUserProject():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserProjectDao.getAllUserProject():: Successfully got the db connection ...");
			var sql = "SELECT UP.ID AS ID,UP.USER_ID AS USER_ID,U.USER_ID AS USERNAME,U.FIRST_NAME FIRSTNAME,U.LAST_NAME LASTNAME,UP.ROLE AS ROLE_ID,R.ROLE_NAME AS ROLE_NAME ,UP.PROJECT_ID AS PROJECT_ID, P.NAME AS PROJECT_NAME,UP.CREATED_BY AS CREATED_BY_ID,C.USER_ID AS CREATED_BY_USERNAME,C.FIRST_NAME AS CREATED_BY_FN, C.LAST_NAME AS CREATED_BY_LN,UP.UPDATED_BY AS UPDATED_BY_ID, UB.USER_ID AS UPDATED_BY_UN, UB.FIRST_NAME AS UB_FN, UB.LAST_NAME AS UB_LN,UP.START_DATE AS START_DATE, UP.END_DATE AS END_DATE, UP.CREATED_DATE AS CREATED_DATE, UP.UPDATED_DATE AS UPDATED_DATE FROM USER_PROJECT AS UP LEFT JOIN PROJECT AS P ON UP.PROJECT_ID = P.PROJECT_ID LEFT JOIN PROJECT_ROLE R ON UP.ROLE = R.ROLE_ID LEFT JOIN USER U ON UP.USER_ID = U.ID AND U.ACTIVE='Y' LEFT JOIN USER C ON UP.CREATED_BY = C.ID LEFT JOIN USER UB ON UP.UPDATED_BY = UB.ID";
			con.query(sql, [], function(err, results){
				if(err){
					console.log("UserProjectDao.getAllUserProject():: Error occurred while retriving all user details... Error: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log("UserProjectDao.getAllUserProject():: successfully executed the query ..."+results.length);
					var arr = new Array();
					for(var i=0; i<results.length; i++){
						var result = results[i];
						var u = new userproject.UserProject(result);
						arr[i]=u;
					}
					self.emit("success", arr);
					console.log("UserProjectDao.getAllUserProject():: successfully emitted success event...");
					con.end();
				}
			});
		}
	});
}

UserProjectDao.prototype.getUserProjectById=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("UserProjectDao.getUserProjectById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('UserProjectDao.getUserProjectById():: Successfully got DB connection ..');
			var sql = "SELECT UP.ID AS ID,UP.USER_ID AS USER_ID,U.USER_ID AS USERNAME,U.FIRST_NAME FIRSTNAME,U.LAST_NAME LASTNAME,UP.ROLE AS ROLE_ID,R.ROLE_NAME AS ROLE_NAME ,UP.PROJECT_ID AS PROJECT_ID, P.NAME AS PROJECT_NAME,UP.CREATED_BY AS CREATED_BY_ID,C.USER_ID AS CREATED_BY_USERNAME,C.FIRST_NAME AS CREATED_BY_FN, C.LAST_NAME AS CREATED_BY_LN,UP.UPDATED_BY AS UPDATED_BY_ID, UB.USER_ID AS UPDATED_BY_UN, UB.FIRST_NAME AS UB_FN, UB.LAST_NAME AS UB_LN,UP.START_DATE AS START_DATE, UP.END_DATE AS END_DATE, UP.CREATED_DATE AS CREATED_DATE, UP.UPDATED_DATE AS UPDATED_DATE FROM USER_PROJECT AS UP LEFT JOIN PROJECT AS P ON UP.PROJECT_ID = P.PROJECT_ID LEFT JOIN PROJECT_ROLE R ON UP.ROLE = R.ROLE_ID LEFT JOIN USER U ON UP.USER_ID = U.ID AND U.ACTIVE='Y' LEFT JOIN USER C ON UP.CREATED_BY = C.ID LEFT JOIN USER UB ON UP.UPDATED_BY = UB.ID WHERE UP.ID = ?";
			con.query(sql, [id], function(err, result){
				if(err){
					console.log('UserProjectDao.getUserProjectById():: error occurred while retrieving project details for id: '+id+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('UserProjectDao.getUserProjectById():: successfully retrieved project details ...');
					if(result.length == 0){
						console.log('UserProjectDao.getUserProjectById():: UserProject details not exist for id: '+id+'... error is: '+err);
						self.emit("notexist", err);
						con.end();
						console.log('UserProjectDao.getUserProjectById():: successfully emitted notexist event ..');
					}
					else{
						var userproj = result[0];
						var u = new userproject.UserProject(userproj);
						
					
						self.emit("exist", u);
						con.end();
						console.log('Successfully emitted exist event .. userproject details are: ');
						console.log(u);
					}
				}
			});
		}
	});
}

UserProjectDao.prototype.deleteUserProjectById=function(userprojid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("UserProjectDao.deleteUserProjectById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('UserProjectDao.deleteUserProjectById():: Successfully got DB connection ..');
			
			var sql = "DELETE FROM USER_PROJECT WHERE ID=?";
			con.query(sql, [userprojid], function(err, results){
				if(err){
					console.log('UserProjectDao.deleteUserProjectById():: error occurred while deleting project details from DB for project id('+userprojid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('UserProjectDao.deleteUserProjectById():: successfully deleted project details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}


UserProjectDao.prototype.updateUserProject = function(userProject){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.error("UserProjectDao.updateUserProject():: Error occurred while getinng database connection ... Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log("UserProjectDao.updateUserProject():: Successfully got database connection ...");
			var date = new Date();
			var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	
			var sql = "UPDATE USER_PROJECT SET PROJECT_ID = ?, ROLE = ?, START_DATE=?,END_DATE=?,UPDATED_BY = (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), UPDATED_DATE=? WHERE ID = ?";
			con.query(sql, [userProject.projid,userProject.role,userProject.startdate,userProject.enddate,userProject.updatedby ,fdate, userProject.userprojid], function(err, results){
				if(err){
					console.error("UserProjectDao.updateUserProject():: Error occurred while updating userproject details ... Error is: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('UserProjectDao.updateUserProject():: Successfully updated userproject details ...'+results);
					self.emit("success");
					console.log('UserProjectDao.updateUserProject():: Successfully emitted success event ...');
					con.end();
				}
			});
		}
	});
}
