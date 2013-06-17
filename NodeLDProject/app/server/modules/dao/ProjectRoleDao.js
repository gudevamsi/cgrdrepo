var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = ProjectRoleDao;
Util.inherits(ProjectRoleDao, EventEmitter);
function ProjectRoleDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

ProjectRoleDao.prototype.insertProjectRole=function(projectrole){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('PROJECT_ROLE', 'ROLE_ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("ProjectRoleDao.insertProjectRole():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("ProjectRoleDao.insertProjectRole():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('ProjectRoleDao.insertProjectRole():: Successfully got connection ...');
				var sql = "INSERT INTO PROJECT_ROLE (ROLE_ID, ROLE_NAME, ROLE_DESCRIPTION, CREATED_BY, CREATED_DATE, ACTIVE) "+
			  	"VALUES (?, ?, ?, ?, ?, 'Y')";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('ProjectRoleDao.insertProjectRole():: Date is: '+fdate);
				con.query(sql, [++id, projectrole.projrolename, projectrole.projroledesc, projectrole.createdby, fdate], function(err, result){
					if(err){
						console.log("ProjectRoleDao.insertProjectRole():: error: "+err);
						console.log("ProjectRoleDao.insertProjectRole():: Failed to insert project role details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("ProjectRoleDao.insertProjectRole():: Successfully inserted project role details in DB ...");
						self.emit("success", id);
						console.log("ProjectRoleDao.insertProjectRole():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

ProjectRoleDao.prototype.getProjectRoleById=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectRoleDao.getProjectRoleById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectRoleDao.getProjectRoleById():: Successfully got DB connection ..');
			var sql = "SELECT * FROM PROJECT_ROLE WHERE ROLE_ID=? AND ACTIVE='Y'";
			con.query(sql, [id], function(err, result){
				if(err){
					console.log('ProjectRoleDao.getProjectRoleById():: error occurred while retrieving project role details for id: '+id+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectRoleDao.getProjectRoleById():: successfully executed query ...');
					if(result.length == 0){
						console.log('ProjectRoleDao.getProjectRoleById():: project role details not exist for id: '+id+'... error is: '+err);
						self.emit("notexist", err);
						con.end();
						console.log('ProjectRoleDao.getProjectRoleById():: successfully emitted notexist event ..');
					}
					else{
						var projrole = result[0];
						var nprojrole = {'projroleid': projrole.ROLE_ID, 'projrolename': projrole.ROLE_NAME, 'projroledesc': projrole.ROLE_DESCRIPTION};
						self.emit("exist", nprojrole);
						con.end();
						console.log('Successfully emitted exist event .. project details are: ');
						console.log(nprojrole);
					}
				}
			});
		}
	});
}

ProjectRoleDao.prototype.getProjectRoleByName=function(projrolename){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectRoleDao.getProjectRoleByName():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectRoleDao.getProjectRoleByName():: Successfully got DB connection ..');
			var sql = "SELECT * FROM PROJECT_ROLE WHERE LOWER(ROLE_NAME)=? AND ACTIVE='Y'";
			con.query(sql, [projrolename], function(err, result){
				if(err){
					console.log('ProjectRoleDao.getProjectRoleByName():: error occurred while retrieving project role details for name: '+projrolename+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectRoleDao.getProjectRoleByName():: successfully executed query ...');
					if(result.length == 0){
						console.log('ProjectRoleDao.getProjectRoleByName():: project role details not exist for rolename: '+projrolename+'... error is: '+err);
						self.emit("notexist", err);
						con.end();
						console.log('ProjectRoleDao.getProjectRoleByName():: successfully emitted notexist event ..');
					}
					else{
						var projrole = result[0];
						var nprojrole = {'projroleid': projrole.ROLE_ID, 'projrolename': projrole.ROLE_NAME, 'projroledesc': projrole.ROLE_DESCRIPTION};
						self.emit("exist", nprojrole);
						con.end();
						console.log('Successfully emitted exist event .. project details are: ');
						console.log(nprojrole);
					}
				}
			});
		}
	});
}

ProjectRoleDao.prototype.getAllProjectRoles=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectRoleDao.getAllProjectRoles():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectRoleDao.getAllProjectRoles():: Successfully got DB connection ..');
			var sql = "SELECT * FROM PROJECT_ROLE WHERE ACTIVE='Y'";
			con.query(sql, [id], function(err, results){
				if(err){
					console.log('ProjectRoleDao.getAllProjectRoles():: error occurred while retrieving project role details... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectRoleDao.getAllProjectRoles():: Successfully retrieved the project role details ...');
					var projrolearr = new Array();
					for(var i=0; i<results.length;i++){
						var rslt = results[i];
			  			
						var projrole = {'projroleid': rslt.ROLE_ID, 'projrolename': rslt.ROLE_NAME, 'projroledesc': rslt.ROLE_DESCRIPTION};
						projrolearr[i] = projrole;
					}
					self.emit("success", projrolearr);
					con.end();
					console.log('ProjectRoleDao.getAllProjectRoles():: Successfully emitted success event ...');
				}
			});
		}
	});
}

ProjectRoleDao.prototype.updateProjectRole=function(projectrole){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectRoleDao.updateProjectRole():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectRoleDao.updateProjectRole():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "UPDATE PROJECT_ROLE SET ROLE_NAME=?, ROLE_DESCRIPTION=?, UPDATED_BY=?, UPDATED_DATE=? WHERE ROLE_ID=?";
			con.query(sql, [projectrole.projrolename, projectrole.projroledesc, projectrole.updatedby, fdate, projectrole.projroleid], function(err, results){
				if(err){
					console.log('ProjectRoleDao.getAllProjects():: error occurred while updating project role details for project role id('+projectrole.projroleid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectRoleDao.getAllProjects():: successfully updated project role details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

ProjectRoleDao.prototype.deleteProjectRoleById=function(projroleid, updatedby){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectRoleDao.deleteProjectRoleById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectRoleDao.deleteProjectRoleById():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "UPDATE PROJECT_ROLE SET ACTIVE='N', UPDATED_BY=?, UPDATED_DATE=? WHERE ROLE_ID=?";
			con.query(sql, [updatedby, fdate, projroleid], function(err, results){
				if(err){
					console.log('ProjectRoleDao.deleteProjectRoleById():: error occurred while deleting project role details from DB for project role id('+projid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectRoleDao.deleteProjectRoleById():: successfully deleted project role details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}