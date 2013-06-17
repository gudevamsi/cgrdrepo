var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = ProjectDao;
Util.inherits(ProjectDao, EventEmitter);
function ProjectDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

ProjectDao.prototype.insertProject=function(project){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('PROJECT', 'PROJECT_ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("ProjectDao.insertProject():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("ProjectDao.insertProject():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('ProjectDao.insertProject():: ProjectDao:: Successfully got connection ...'+con);
				console.log(project.projname);
				var sql = "INSERT INTO PROJECT (PROJECT_ID, NAME, DESCRIPTION, START_DATE, END_DATE, CREATED_BY, CREATED_DATE, ACTIVE) "+
			  	"VALUES (?, ?, ?, ?, ?, ?, ?, 'Y')";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('ProjectDao.insertProject():: Date is: '+fdate);
				con.query(sql, [++id, project.projname, project.projdesc, project.startdate, project.enddate, project.createdby, fdate], function(err, result){
					if(err){
						console.log("ProjectDao.insertProject():: error: "+err);
						console.log("ProjectDao.insertProject():: Failed to insert project details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("ProjectDao.insertProject():: Successfully inserted project details in DB ...");
						self.emit("success", id);
						console.log("ProjectDao.insertProject():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

ProjectDao.prototype.getProjctById=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.getProjctById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.getProjctById():: Successfully got DB connection ..');
			var sql = "SELECT * FROM PROJECT WHERE PROJECT_ID=? AND ACTIVE='Y'";
			con.query(sql, [id], function(err, result){
				if(err){
					console.log('ProjectDao.getProjctById():: error occurred while retrieving project details for id: '+id+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.getProjctById():: successfully retrieved project details ...');
					if(result.length == 0){
						console.log('ProjectDao.getProjctById():: project details not exist for id: '+id+'... error is: '+err);
						self.emit("notexist", err);
						con.end();
						console.log('ProjectDao.getProjctById():: successfully emitted notexist event ..');
					}
					else{
						var proj = result[0];
						var start = proj.START_DATE;
			  			var sdate = dateFormat(start, "yyyy-mm-dd");
			  			
			  			var end = proj.END_DATE;
			  			var edate = '';
			  			if(end==null || end =='Invalid Date'){
			  				edate = '';
			  			}
			  			else{
			  				edate = dateFormat(end, "yyyy-mm-dd");
			  			}
						var nproj = {'projid': proj.PROJECT_ID, 'projname': proj.NAME, 'projdesc': proj.DESCRIPTION, 
							'startdate': sdate, 'enddate': edate};
						self.emit("exist", nproj);
						con.end();
						console.log('Successfully emitted exist event .. project details are: ');
						console.log(nproj);
					}
				}
			});
		}
	});
}

ProjectDao.prototype.getAllProjects=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.getAllProjects():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.getAllProjects():: Successfully got DB connection ..');
			var sql = "SELECT * FROM PROJECT WHERE ACTIVE='Y'";
			con.query(sql, [id], function(err, results){
				if(err){
					console.log('ProjectDao.getAllProjects():: error occurred while retrieving project details... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.getAllProjects():: Successfully retrieved the project details ...');
					var projarr = new Array();
					for(var i=0; i<results.length;i++){
						var rslt = results[i];
						
						var start = rslt.START_DATE;
			  			var sdate = dateFormat(start, "yyyy-mm-dd");
			  			console.log('ProjectDao.getAllProjects():: start date is: '+sdate);
			  			
			  			var end = rslt.END_DATE;
			  			var edate = '';
			  			if(end==null || end =='Invalid Date'){
			  				edate = '';
			  			}
			  			else{
			  				edate = dateFormat(end, "yyyy-mm-dd");
			  			}
			  			console.log('ProjectDao.getAllProjects():: end date is: '+edate);
			  			
						var proj = {'projid': rslt.PROJECT_ID, 'projname': rslt.NAME, 'startdate': sdate, 'enddate': edate};
						projarr[i] = proj;
					}
					self.emit("success", projarr);
					con.end();
					console.log('ProjectDao.getAllProjects():: Successfully emitted success event ...');
				}
			});
		}
	});
}

ProjectDao.prototype.updateProject=function(project){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.updateProject():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.updateProject():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "UPDATE PROJECT SET NAME=?, DESCRIPTION=?, START_DATE=?, END_DATE=?, UPDATED_BY=?, UPDATED_DATE=? WHERE PROJECT_ID=?";
			con.query(sql, [project.projname, project.projdesc, project.startdate, project.enddate, project.updatedby, fdate, project.projid], function(err, results){
				if(err){
					console.log('ProjectDao.getAllProjects():: error occurred while updating project details for project id('+project.projid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.getAllProjects():: successfully updated project details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

ProjectDao.prototype.deleteProjectById=function(projid, updatedby){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.deleteProjectById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.deleteProjectById():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "UPDATE PROJECT SET ACTIVE='N', UPDATED_BY=?, UPDATED_DATE=? WHERE PROJECT_ID=?";
			con.query(sql, [updatedby, fdate, projid], function(err, results){
				if(err){
					console.log('ProjectDao.deleteProjectById():: error occurred while deleting project details from DB for project id('+projid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.deleteProjectById():: successfully deleted project details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

ProjectDao.prototype.insertProjectAppreciation=function(projectapprJson){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('USER_PROJECT_APPRECIATION', 'ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("ProjectDao.insertProjectAppreciation():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("ProjectDao.insertProjectAppreciation():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('ProjectDao.insertProjectAppreciation():: ProjectDao:: Successfully got connection ...'+con);
				console.log(projectapprJson.projId);
				var sql = "INSERT INTO USER_PROJECT_APPRECIATION (id,USER_ID,project_id,APPRECIATION_FROM,  APPRECIATION_DETAILS, APPRECIATION_DATE,created_by,updated_by,updated_date,CREATED_DATE) "
						  +"VALUES (?, ?, ?, ?,? ,?, (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?), ?,?)";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('ProjectDao.insertProjectAppreciation():: Date is: '+fdate);
				con.query(sql, [++id,projectapprJson.userId, projectapprJson.projId, projectapprJson.appreciationBy, projectapprJson.appreciationDesc, projectapprJson.receiveDate, projectapprJson.createdby, projectapprJson.updatedBy, fdate,fdate], function(err, result){
					if(err){
						console.log("ProjectDao.insertProjectAppreciation():: error: "+err);
						console.log("ProjectDao.insertProjectAppreciation():: Failed to insert Appreciation details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("ProjectDao.insertProjectAppreciation():: Successfully inserted appreciation details in DB ...");
						self.emit("success", id);
						console.log("ProjectDao.insertProjectAppreciation():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

ProjectDao.prototype.getAllAppreciationByUserId=function(id){
	var self = this;
	
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("ProjectDao.getAllAppreciationByUserId():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('ProjectDao.getAllAppreciationByUserId():: ProjectDao:: Successfully got connection ...'+con);
				console.log(id);
				var sql = "SELECT UP.ID AS ID,UP.USER_ID AS USER_ID,U.USER_ID AS USERNAME,U.FIRST_NAME FIRSTNAME,U.LAST_NAME LASTNAME,UP.APPRECIATION_FROM APPRECIATION_FROM,UP.APPRECIATION_DETAILS APPRECIATOIN_DETAILS,UP.APPRECIATION_DATE APPRECIATION_DATE, "
					+"UP.PROJECT_ID AS PROJECT_ID, P.NAME AS PROJECT_NAME,UP.CREATED_BY AS CREATED_BY_ID,C.USER_ID AS CREATED_BY_USERNAME,C.FIRST_NAME AS CREATED_BY_FN, "
					+"C.LAST_NAME AS CREATED_BY_LN,UP.UPDATED_BY AS UPDATED_BY_ID, UB.USER_ID AS UPDATED_BY_UN, UB.FIRST_NAME AS UB_FN, UB.LAST_NAME AS UB_LN, UP.CREATED_DATE AS CREATED_DATE, UP.UPDATED_DATE AS UPDATED_DATE " 
					+"FROM USER_PROJECT_APPRECIATION AS UP " 
					+"LEFT JOIN PROJECT AS P ON UP.PROJECT_ID = P.PROJECT_ID " 
					+"LEFT JOIN USER U ON UP.USER_ID = U.ID AND U.ACTIVE='Y' "
					+"LEFT JOIN USER C ON UP.CREATED_BY = C.ID " 
					+"LEFT JOIN USER UB ON UP.UPDATED_BY = UB.ID "
					+"WHERE UP.USER_ID = (SELECT P.ID FROM (SELECT * FROM USER) AS P WHERE P.USER_ID=?) ";
			  	con.query(sql, [id], function(err, results){
					if(err){
						console.log("ProjectDao.getAllAppreciationByUserId():: error: "+err);
						console.log("ProjectDao.getAllAppreciationByUserId():: Failed to fetch Appreciation details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						var arr = new Array();
						for(var i=0; i<results.length; i++){
							var rslt = results[i];
							var u = {'id': rslt.ID, 'USER_ID': rslt.USER_ID, 'FIRST_NAME': rslt.FIRSTNAME,'LAST_NAME':rslt.LASTNAME,'PROJECT_ID':rslt.PROJECT_ID,'PROJECT_NAME':rslt.PROJECT_NAME,'UPDATED_BY_FN':rslt.UB_FN,'UPDATED_BY_LN':rslt.UB_LN,									
									'APPRECIATION_FROM': rslt.APPRECIATION_FROM, 'APPRECIATOIN_DETAILS': rslt.APPRECIATOIN_DETAILS, 'APPRECIATIO_DATE' : dateFormat(rslt.APPRECIATION_DATE, "yyyy-mm-dd"), 
									'ADDED_BY': rslt.CREATED_BY, 'UPDATED_DATE': dateFormat(rslt.UPDATED_DATE, "yyyy-mm-dd")};
							arr[i]=u;
						}
						self.emit("success", arr);
						console.log("ProjectDao.getAllAppreciationByUserId():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
}

ProjectDao.prototype.getAllAppreciation=function(id){
	var self = this;
	
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("ProjectDao.getAllAppreciation():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('ProjectDao.getAllAppreciation():: ProjectDao:: Successfully got connection ...'+con);
				console.log(id);
				var sql = "SELECT UP.ID AS ID,UP.USER_ID AS USER_ID,U.USER_ID AS USERNAME,U.FIRST_NAME FIRSTNAME,U.LAST_NAME LASTNAME,UP.APPRECIATION_FROM APPRECIATION_FROM,UP.APPRECIATION_DETAILS APPRECIATOIN_DETAILS,UP.APPRECIATION_DATE APPRECIATION_DATE, "
					+"UP.PROJECT_ID AS PROJECT_ID, P.NAME AS PROJECT_NAME,UP.CREATED_BY AS CREATED_BY_ID,C.USER_ID AS CREATED_BY_USERNAME,C.FIRST_NAME AS CREATED_BY_FN, "
					+"C.LAST_NAME AS CREATED_BY_LN,UP.UPDATED_BY AS UPDATED_BY_ID, UB.USER_ID AS UPDATED_BY_UN, UB.FIRST_NAME AS UB_FN, UB.LAST_NAME AS UB_LN, UP.CREATED_DATE AS CREATED_DATE, UP.UPDATED_DATE AS UPDATED_DATE " 
					+"FROM USER_PROJECT_APPRECIATION AS UP " 
					+"LEFT JOIN PROJECT AS P ON UP.PROJECT_ID = P.PROJECT_ID " 
					+"LEFT JOIN USER U ON UP.USER_ID = U.ID AND U.ACTIVE='Y' "
					+"LEFT JOIN USER C ON UP.CREATED_BY = C.ID " 
					+"LEFT JOIN USER UB ON UP.UPDATED_BY = UB.ID ";
					
			  	con.query(sql, [id], function(err, results){
					if(err){
						console.log("ProjectDao.getAllAppreciation():: error: "+err);
						console.log("ProjectDao.getAllAppreciation():: Failed to fetch Appreciation details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						var arr = new Array();
						for(var i=0; i<results.length; i++){
							var rslt = results[i];
							var u = {'id': rslt.ID, 'USER_ID': rslt.USER_ID, 'FIRST_NAME': rslt.FIRSTNAME,'LAST_NAME':rslt.LASTNAME,'PROJECT_ID':rslt.PROJECT_ID,'PROJECT_NAME':rslt.PROJECT_NAME,'UPDATED_BY_FN':rslt.UB_FN,'UPDATED_BY_LN':rslt.UB_LN,									
									'APPRECIATION_FROM': rslt.APPRECIATION_FROM, 'APPRECIATOIN_DETAILS': rslt.APPRECIATOIN_DETAILS, 'APPRECIATIO_DATE' : dateFormat(rslt.APPRECIATION_DATE, "yyyy-mm-dd"), 
									'ADDED_BY': rslt.CREATED_BY, 'UPDATED_DATE': dateFormat(rslt.UPDATED_DATE, "yyyy-mm-dd")};
							arr[i]=u;
						}
						self.emit("success", arr);
						console.log("ProjectDao.getAllAppreciation():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
}

ProjectDao.prototype.getAllAppreciationById=function(id){
	var self = this;
	
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("ProjectDao.getAllAppreciationById():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('ProjectDao.getAllAppreciationById():: ProjectDao:: Successfully got connection ...'+con);
				console.log(id);
				var sql = "SELECT UP.ID AS ID,UP.USER_ID AS USER_ID,U.USER_ID AS USERNAME,U.FIRST_NAME FIRSTNAME,U.LAST_NAME LASTNAME,UP.APPRECIATION_FROM APPRECIATION_FROM,UP.APPRECIATION_DETAILS APPRECIATOIN_DETAILS,UP.APPRECIATION_DATE APPRECIATION_DATE, "
					+"UP.PROJECT_ID AS PROJECT_ID, P.NAME AS PROJECT_NAME,UP.CREATED_BY AS CREATED_BY_ID,C.USER_ID AS CREATED_BY_USERNAME,C.FIRST_NAME AS CREATED_BY_FN, "
					+"C.LAST_NAME AS CREATED_BY_LN,UP.UPDATED_BY AS UPDATED_BY_ID, UB.USER_ID AS UPDATED_BY_UN, UB.FIRST_NAME AS UB_FN, UB.LAST_NAME AS UB_LN, UP.CREATED_DATE AS CREATED_DATE, UP.UPDATED_DATE AS UPDATED_DATE " 
					+"FROM USER_PROJECT_APPRECIATION AS UP " 
					+"LEFT JOIN PROJECT AS P ON UP.PROJECT_ID = P.PROJECT_ID " 
					+"LEFT JOIN USER U ON UP.USER_ID = U.ID AND U.ACTIVE='Y' "
					+"LEFT JOIN USER C ON UP.CREATED_BY = C.ID " 
					+"LEFT JOIN USER UB ON UP.UPDATED_BY = UB.ID "
					+"WHERE UP.ID = ?";
			  	con.query(sql, [id], function(err, results){
					if(err){
						console.log("ProjectDao.getAllAppreciationById():: error: "+err);
						console.log("ProjectDao.getAllAppreciationById():: Failed to fetch Appreciation details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						
							var rslt = results[0];
							var u = {'id': rslt.ID, 'USER_ID': rslt.USER_ID, 'FIRST_NAME': rslt.FIRSTNAME,'LAST_NAME':rslt.LASTNAME,'PROJECT_ID':rslt.PROJECT_ID,'PROJECT_NAME':rslt.PROJECT_NAME,'UPDATED_BY_FN':rslt.UB_FN,'UPDATED_BY_LN':rslt.UB_LN,									
									'APPRECIATION_FROM': rslt.APPRECIATION_FROM, 'APPRECIATOIN_DETAILS': rslt.APPRECIATOIN_DETAILS, 'APPRECIATIO_DATE' : dateFormat(rslt.APPRECIATION_DATE, "yyyy-mm-dd"), 
									'ADDED_BY': rslt.CREATED_BY, 'UPDATED_DATE': dateFormat(rslt.UPDATED_DATE, "yyyy-mm-dd")};
							
						self.emit("success", u);
						console.log("ProjectDao.getAllAppreciation():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
}
ProjectDao.prototype.updateAppreciation=function(appreciation){
	var self = this;
	console.log(appreciation);
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.updateAppreciation():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.updateAppreciation():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "UPDATE USER_PROJECT_APPRECIATION SET APPRECIATION_FROM=?, APPRECIATION_DATE=?, APPRECIATION_DETAILS=? WHERE ID=?";
			con.query(sql, [appreciation.apprby, appreciation.apprdate, appreciation.apprdesc, appreciation.apprid], function(err, results){
				if(err){
					console.log('ProjectDao.updateAppreciation():: error occurred while updating APPRECIATION details for APPRECIATION id('+appreciation.apprid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.updateAppreciation():: successfully updated project details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

ProjectDao.prototype.deleteAppreciationById=function(apprid, updatedby){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.deleteAppreciationById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.deleteAppreciationById():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "DELETE FROM USER_PROJECT_APPRECIATION WHERE ID = ?";
			con.query(sql, [apprid], function(err, results){
				if(err){
					console.log('ProjectDao.deleteAppreciationById():: error occurred while deleting APPRECIATION details from DB for appreciation id('+apprid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.deleteAppreciationById():: successfully deleted appreciation details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

ProjectDao.prototype.getAllUserProjects=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.getAllUserProjects():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.getAllUserProjects():: Successfully got DB connection ..');
			var sql = "SELECT P.PROJECT_ID, P.NAME, P.DESCRIPTION, UP.START_DATE, UP.END_DATE, PR.ROLE_NAME FROM PROJECT P, USER_PROJECT UP, "+
			" PROJECT_ROLE PR WHERE P.PROJECT_ID=UP.PROJECT_ID AND UP.ROLE = PR.ROLE_ID AND UP.USER_ID=? ORDER BY UP.START_DATE DESC";
			con.query(sql, [userid], function(err, results){
				if(err){
					console.log('ProjectDao.getAllUserProjects():: error occurred while getting user project details from DB for user id('+userid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.getAllUserProjects():: successfully retrieved project details ...');
					var projarr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						
						var sdate = rslt.START_DATE;
						var startdate = dateFormat(sdate, "yyyy-mm-dd");
						
						var edate = rslt.END_DATE;
						var enddate = '';
						if(edate!=null){
							enddate = dateFormat(edate, "yyyy-mm-dd");
						}
						
						var proj = {'projid': rslt.PROJECT_ID, 'projname': rslt.NAME, 'projdesc': rslt.DESCRIPTION, 'projstartdate': startdate,
							'projenddate': enddate, 'projrole': rslt.ROLE_NAME};
						projarr[i] = proj;
					}					
					self.emit("projsuccess", projarr);
					con.end();
				}
			});
		}
	});
}

ProjectDao.prototype.getProjectAppreciationForUser=function(projidarr, userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("ProjectDao.getProjectAppreciationForUser():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('ProjectDao.getProjectAppreciationForUser():: Successfully got DB connection ..');
			var qmarks = '';
			for(var i=0; i<projidarr.length; i++){
				qmarks+='?,';
			}
			qmarks=qmarks.substring(0, qmarks.length-1);
			var sql = "SELECT PROJECT_ID, APPRECIATION_FROM, APPRECIATION_DETAILS, APPRECIATION_DATE FROM USER_PROJECT_APPRECIATION "+
				"WHERE PROJECT_ID IN ("+qmarks+") AND USER_ID=?";
			projidarr[projidarr.length] = userid;
			console.log(projidarr);
			con.query(sql, projidarr, function(err, results){
				if(err){
					console.log('ProjectDao.getProjectAppreciationForUser():: error occurred while retrieving APPRECIATION details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('ProjectDao.getProjectAppreciationForUser():: successfully retrieved appreciation details ...');
					var projapparr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						
						var adate = rslt.APPRECIATION_DATE;
						var appdate = dateFormat(adate, "yyyy-mm-dd");
						
						var projapp = {'projid': rslt.PROJECT_ID, 'projappfrom': rslt.APPRECIATION_FROM, 'projappdetails': rslt.APPRECIATION_DETAILS,
							'projappdate': appdate};
						projapparr[i] = projapp;
					}
					self.emit("appsuccess", projapparr);
					con.end();
				}
			});
		}
	});
}