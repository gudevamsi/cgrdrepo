var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");
var TrainingCourseDao = require('./TrainingCourseDao');

module.exports = TrainingDao;
Util.inherits(TrainingDao, EventEmitter);
function TrainingDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

TrainingDao.prototype.insertTraining=function(training){
	var self = this;
	console.log(training);
	var tdao = new TrainingCourseDao(self.mysqlconpool);
	var trainingcourse = {'trainingname': training.trainingname, 'trainingdesc': training.trainingdesc, 'createdby': training.createdby};
	tdao.insertTrainingCourse(trainingcourse);
	
	tdao.on("error", function(err){
		console.error('TrainingDao.insertTraining():: Error occurred while inserting traning course details ... error is: '+err);
		self.emit("error", err);
	});
	
	tdao.on("success", function(trainingcourseid){
		console.log('TrainingDao.insertTraining():: Successfully inserted training course details in db ... id is: '+trainingcourseid);
		
		var CommonDao = require('./CommonDao');
		var dao = new CommonDao(self.mysqlconpool);
		dao.getMaxId('TRAINING', 'TRAINING_ID');
		
		dao.on("error", function(err){
			console.log('Error: '+err);
			self.emit("error", err);
		});
		
		dao.on("maxid", function(result){
			var id = parseInt(result);
			console.log("TrainingDao.insertTraining():: Received maxid event ..."+id);
			
			self.mysqlconpool.getConnection(function(err, con){
				if(err){
					console.log("TrainingDao.insertTraining():: Error occurred while getting connection .. Error is: "+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.insertTraining():: Successfully got connection ...'+con);
					var sql = "INSERT INTO TRAINING (TRAINING_ID, TRAINING_COURSE_ID, DURATION, SCHEDULED_DATE, CREATED_BY, CREATED_DATE, ACTIVE, OPEN_FOR_NOMINATION) "+
				  	"VALUES (?, ?, ?, ?, ?, ?, 'Y', ?)";
				  	var date = new Date();
				  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
				  	console.log('TrainingDao.insertTraining():: Date is: '+fdate);
					con.query(sql, [++id, trainingcourseid, parseInt(training.duration), training.scheduleddate, training.createdby, fdate, training.openForNomination], function(err, result){
						if(err){
							console.log("TrainingDao.insertTraining():: error: "+err);
							console.log("TrainingDao.insertTraining():: Failed to insert training details in DB ... Error: "+err);
							self.emit("error", err);
							con.end();
						}
						else{
							console.log("TrainingDao.insertTraining():: Successfully inserted training details in DB ...");
							self.emit("success", id);
							console.log("TrainingDao.insertTraining():: Emitted event success ..");
							con.end();
						}
					});	
				}
			});
		});
	});
}

TrainingDao.prototype.getTrainingById=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.getTrainingById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.getTrainingById():: Successfully got DB connection ..');
			var sql = "SELECT T.TRAINING_ID, TC.NAME, TC.DESCRIPTION, T.SCHEDULED_DATE, T.DURATION, T.OPEN_FOR_NOMINATION FROM TRAINING T, TRAINING_COURSE TC WHERE T.TRAINING_COURSE_ID = TC.TRAINING_COURSE_ID AND T.TRAINING_ID=? AND ACTIVE='Y'";
			con.query(sql, [id], function(err, result){
				if(err){
					console.log('TrainingDao.getTrainingById():: error occurred while retrieving training details for id: '+id+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.getTrainingById():: successfully retrieved training details ...');
					if(result.length == 0){
						console.log('TrainingDao.getTrainingById():: training details not exist for id: '+id+'... error is: '+err);
						self.emit("notexist", err);
						con.end();
						console.log('TrainingDao.getTrainingById():: successfully emitted notexist event ..');
					}
					else{
						var training = result[0];
						var scheduleddate = training.SCHEDULED_DATE;
			  			var sdate = dateFormat(scheduleddate, "yyyy-mm-dd");
			  			
						var ntraining = {'trainingid': training.TRAINING_ID, 'trainingname': training.NAME, 'trainingdesc': training.DESCRIPTION, 
							'scheduleddate': sdate, 'duration': training.DURATION, 'openForNomination': training.OPEN_FOR_NOMINATION};
						self.emit("exist", ntraining);
						con.end();
						console.log('TrainingDao.getTrainingById()::Successfully emitted exist event .. training details are: ');
					}
				}
			});
		}
	});
}

TrainingDao.prototype.getAllTrainings=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.getAllTrainings():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.getAllTrainings():: Successfully got DB connection ..');
			var sql = "SELECT T.TRAINING_ID, TC.NAME, TC.DESCRIPTION, T.SCHEDULED_DATE, T.DURATION, T.OPEN_FOR_NOMINATION FROM TRAINING T, TRAINING_COURSE TC WHERE T.TRAINING_COURSE_ID = TC.TRAINING_COURSE_ID AND ACTIVE='Y'";
			con.query(sql, [id], function(err, results){
				if(err){
					console.log('TrainingDao.getAllTrainings():: error occurred while retrieving training details... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.getAllTrainings():: Successfully retrieved training details ...');
					var trainingarr = new Array();
					for(var i=0; i<results.length;i++){
						var rslt = results[i];
						
						var schdate = rslt.SCHEDULED_DATE;
			  			var sdate = dateFormat(schdate, "yyyy-mm-dd");
			  			console.log('TrainingDao.getAllTrainings():: start date is: '+sdate);

						var training = {'trainingid': rslt.TRAINING_ID, 'trainingname': rslt.NAME, 'trainingdesc': rslt.DESCRIPTION, 
						'scheduleddate': sdate, 'duration': rslt.DURATION, 'openForNomination': rslt.OPEN_FOR_NOMINATION};
						trainingarr[i] = training;
					}
					self.emit("success", trainingarr);
					con.end();
					console.log('TrainingDao.getAllTrainings():: Successfully emitted success event ...'+trainingarr.length);
				}
			});
		}
	});
}

TrainingDao.prototype.updateTraining=function(training){
	var self = this;
	console.log('TrainingDao.updateTraining():: Received object is: ');
	console.log(training);
	var tdao = new TrainingCourseDao(self.mysqlconpool);
	var trainingcourse = {'trainingid': training.trainingid, 'trainingname': training.trainingname, 'trainingdesc': training.trainingdesc, 'updatedby': training.updatedby};
	tdao.updateTrainingCourse(trainingcourse);
	
	tdao.on("error", function(err){
		console.error('TrainingDao.updateTraining():: Error occurred while updating traning course details ... error is: '+err);
		self.emit("error", err);
	});
	
	tdao.on("success", function(){
		console.log('TrainingDao.updateTraining()::Successfully updated training course details ...');
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("TrainingDao.updateTraining():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('TrainingDao.updateTraining():: Successfully got DB connection ..');
				var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
				var sql = "UPDATE TRAINING SET DURATION=?, SCHEDULED_DATE=?, OPEN_FOR_NOMINATION=?, UPDATED_BY=?, UPDATED_DATE=? WHERE TRAINING_ID=?";
				con.query(sql, [training.duration, training.scheduleddate, training.openForNomination, training.updatedby, fdate, training.trainingid], function(err, results){
					if(err){
						console.log('TrainingDao.updateTraining():: error occurred while updating training details for training id('+training.trainingid+')... error is: '+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log('TrainingDao.updateTraining():: successfully updated training details ...');
						self.emit("success");
						con.end();
					}
				});
			}
		});
	});
}

TrainingDao.prototype.deleteTrainingById=function(trainingid, updatedby){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.deleteTrainingById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.deleteTrainingById():: Successfully got DB connection ..');
			var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			var sql = "UPDATE TRAINING SET ACTIVE='N', UPDATED_BY=?,UPDATED_DATE=? WHERE TRAINING_ID=?";
			con.query(sql, [updatedby, fdate, trainingid], function(err, results){
				if(err){
					console.log('TrainingDao.deleteTrainingById():: error occurred while deleting training details from DB for training id('+trainingid+')... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.deleteTrainingById():: successfully deleted training details ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

TrainingDao.prototype.getAllFutureTrainings=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.getAllFutureTrainings():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.getAllFutureTrainings():: Successfully got DB connection ..');
			var sql = "SELECT T.TRAINING_ID, TC.NAME, TC.DESCRIPTION, T.DURATION, T.SCHEDULED_DATE,T.OPEN_FOR_NOMINATION openForNomination 	 FROM TRAINING T, TRAINING_COURSE TC "+
			"WHERE T.TRAINING_COURSE_ID=TC.TRAINING_COURSE_ID AND T.SCHEDULED_DATE > NOW() AND T.ACTIVE='Y' AND T.OPEN_FOR_NOMINATION='Y' AND "+
			"T.TRAINING_ID NOT IN (SELECT TN.TRAINING_ID FROM TRAINING_NOMINATION TN, USER U WHERE TN.USER_ID=U.ID AND (TN.APPROVED_DENIED='Y' OR TN.APPROVED_DENIED IS NULL) AND U.USER_ID=?)";
			con.query(sql, [userid], function(err, results){
				if(err){
					console.log('TrainingDao.getAllFutureTrainings():: error occurred while getting future training details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.getAllFutureTrainings():: successfully get future training details ...');
					var trainingarr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						var schdate = rslt.SCHEDULED_DATE;
			  			var sdate = dateFormat(schdate, "yyyy-mm-dd");
			  			var training = {'trainingid': rslt.TRAINING_ID, 'trainingname': rslt.NAME, 'trainingdesc': rslt.DESCRIPTION, 
						'scheduleddate': sdate, 'duration': rslt.DURATION,'openForNomination':rslt.openForNomination};
						trainingarr[i] = training;
					}
					self.emit("success", trainingarr);
					con.end();
				}
			});
		}
	});
}

TrainingDao.prototype.getFutureSubscribedTrainings=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.getFutureSubscribedTrainings():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.getFutureSubscribedTrainings():: Successfully got DB connection ..');
			var sql = "SELECT T.TRAINING_ID, TC.NAME, TC.DESCRIPTION, T.DURATION, T.SCHEDULED_DATE, TN.APPROVAL_PENDING,TN.APPROVED_DENIED, TN.UPDATED_DATE FROM "+
					  "TRAINING T, TRAINING_COURSE TC, TRAINING_NOMINATION TN, USER U WHERE T.TRAINING_COURSE_ID=TC.TRAINING_COURSE_ID AND "+
					  "T.TRAINING_ID=TN.TRAINING_ID AND TN.USER_ID=U.ID AND U.USER_ID=? AND  T.SCHEDULED_DATE > NOW() AND T.ACTIVE='Y' AND "+
					  "T.OPEN_FOR_NOMINATION='Y'";
			con.query(sql, [userid], function(err, results){
				if(err){
					console.log('TrainingDao.getFutureSubscribedTrainings():: error occurred while getting future subscribed training details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.getFutureSubscribedTrainings():: successfully get future subscribed training details ...');
					var trainingarr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						var schdate = rslt.SCHEDULED_DATE;
			  			var sdate = dateFormat(schdate, "yyyy-mm-dd");
			  			
			  			schdate = rslt.UPDATED_DATE;
			  			var udate = '';
			  			if(schdate!=null && schdate!=''){
			  				udate = dateFormat(schdate, "yyyy-mm-dd");
			  			}
			  			
			  			var training = {'trainingid': rslt.TRAINING_ID, 'trainingname': rslt.NAME, 'trainingdesc': rslt.DESCRIPTION, 
						'scheduleddate': sdate, 'duration': rslt.DURATION, 'approvalpending' : rslt.APPROVAL_PENDING, 
						'approveddenied': rslt.APPROVED_DENIED, 'updateddate': udate};
						trainingarr[i] = training;
					}
					self.emit("subscribesuccess", trainingarr);
					con.end();
				}
			});
		}
	});
}

TrainingDao.prototype.getAllPendingApprovalTrainings=function(managerid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.getAllPendingApprovalTrainings():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.getAllPendingApprovalTrainings():: Successfully got DB connection ..');
			var sql = "SELECT TN.TRAINING_NOMINATION_ID, T.TRAINING_ID, U.FIRST_NAME, U.LAST_NAME, U.USER_ID, U.ID, TC.NAME, T.SCHEDULED_DATE,T.DURATION, "+
					  "TN.CREATED_DATE FROM USER U, TRAINING T, TRAINING_COURSE TC, TRAINING_NOMINATION TN WHERE T.TRAINING_COURSE_ID=TC.TRAINING_COURSE_ID "+
					  "AND T.TRAINING_ID=TN.TRAINING_ID AND TN.APPROVAL_PENDING='Y' AND TN.USER_ID=U.ID AND U.ID  IN (SELECT ID FROM USER WHERE MANAGER=?)";
			con.query(sql, [managerid], function(err, results){
				if(err){
					console.log('TrainingDao.getAllPendingApprovalTrainings():: error occurred while getting approval pending training details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.getAllPendingApprovalTrainings():: successfully get pending approval training details ...');
					var trainingarr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						
						var schdate = rslt.SCHEDULED_DATE;
			  			var sdate = dateFormat(schdate, "yyyy-mm-dd");
			  			
			  			schdate = rslt.CREATED_DATE;
			  			var subdate = dateFormat(schdate, "yyyy-mm-dd");
			  			
			  			var training = {'trainingid': rslt.TRAINING_ID, 'trainingnominationid': rslt.TRAINING_NOMINATION_ID ,
			  			'trainingname': rslt.NAME, 'scheduleddate': sdate, 'duration': rslt.DURATION, 'firstname': rslt.FIRST_NAME,
			  			'lastname': rslt.LAST_NAME, 'subscribeddate': subdate, 'userid': rslt.USER_ID, 'userprimaryid': rslt.ID};
						trainingarr[i] = training;
					}
					self.emit("success", trainingarr);
					con.end();
				}
			});
		}
	});
}

TrainingDao.prototype.getAllAttendedTrainingsForUser=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingDao.getAllAttendedTrainingsForUser():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingDao.getAllAttendedTrainingsForUser():: Successfully got DB connection ..');
			var sql = "SELECT T.TRAINING_ID, TC.NAME, TC.DESCRIPTION, T.SCHEDULED_DATE, T.DURATION, TN.ATTENDED, TN.APPROVED_DENIED FROM "+
				" TRAINING_COURSE TC, TRAINING T, TRAINING_NOMINATION TN WHERE TC.TRAINING_COURSE_ID = T.TRAINING_COURSE_ID AND "+
				" T.TRAINING_ID = TN.TRAINING_ID AND TN.APPROVAL_PENDING='N' AND TN.APPROVED_DENIED='Y' AND TN.ATTENDED='Y' AND TN.USER_ID=?";
			con.query(sql, [userid], function(err, results){
				if(err){
					console.log('TrainingDao.getAllAttendedTrainingsForUser():: error occurred while getting attended training details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingDao.getAllAttendedTrainingsForUser():: successfully get attended training details ...');
					var trainingarr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						var schdate = rslt.SCHEDULED_DATE;
			  			var sdate = dateFormat(schdate, "yyyy-mm-dd");
			  			var training = {'trainingid': rslt.TRAINING_ID, 'trainingname': rslt.NAME, 'trainingdesc': rslt.DESCRIPTION, 
						'scheduleddate': sdate, 'duration': rslt.DURATION, 'attended': rslt.DESCRIPTION};
						trainingarr[i] = training;
					}
					self.emit("trasuccess", trainingarr);
					console.log('TrainingDao.getAllAttendedTrainingsForUser()::  successfully emitted trasuccess event ...');
					con.end();
				}
			});
		}
	});
}