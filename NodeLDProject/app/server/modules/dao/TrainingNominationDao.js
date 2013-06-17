var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = TrainingNominationDao;
Util.inherits(TrainingNominationDao, EventEmitter);
function TrainingNominationDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

TrainingNominationDao.prototype.insertTrainingNomination=function(trainingid, userprimaryid, createdby){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('TRAINING_NOMINATION', 'TRAINING_NOMINATION_ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("TrainingNominationDao.insertTrainingNomination():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("TrainingNominationDao.insertTrainingNomination():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('TrainingNominationDao.insertTrainingNomination():: Successfully got connection ...'+con);
				var sql = "INSERT INTO TRAINING_NOMINATION(TRAINING_NOMINATION_ID, USER_ID, TRAINING_ID, APPROVAL_PENDING, NOMINATED_BY, CREATED_BY, CREATED_DATE) "+
						  "VALUES (?, ?, ?, 'Y', 'SELF', ?, ?)";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('TrainingNominationDao.insertTrainingNomination():: Date is: '+fdate);
				con.query(sql, [++id, userprimaryid, trainingid, createdby, fdate], function(err, result){
					if(err){
						console.log("TrainingNominationDao.insertTrainingNomination():: error: "+err);
						console.log("TrainingNominationDao.insertTrainingNomination():: Failed to insert training nomination details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("TrainingNominationDao.insertTrainingNomination():: Successfully inserted training nomination details in DB ...");
						self.emit("success", id);
						console.log("TrainingNominationDao.insertTrainingNomination():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

TrainingNominationDao.prototype.getTrainingNominationDetails=function(trainingid, nominationid, userprimaryid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingNominationDao.getTrainingNominationDetails():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingNominationDao.getTrainingNominationDetails():: Successfully got DB connection ..');
			var sql = "SELECT TN.TRAINING_NOMINATION_ID, T.TRAINING_ID, U.FIRST_NAME, U.LAST_NAME,U.ID, U.USER_ID, TC.NAME, T.SCHEDULED_DATE, "+
					  "T.DURATION, TN.CREATED_DATE, TC.DESCRIPTION FROM USER U, TRAINING T, TRAINING_COURSE TC, TRAINING_NOMINATION TN WHERE "+
					  "T.TRAINING_COURSE_ID=TC.TRAINING_COURSE_ID AND T.TRAINING_ID=TN.TRAINING_ID AND TN.USER_ID=U.ID AND "+
					  "TN.APPROVAL_PENDING='Y' AND TN.TRAINING_NOMINATION_ID=? AND U.ID=?";
			con.query(sql, [nominationid, userprimaryid], function(err, result){
				if(err){
					console.log('TrainingNominationDao.getTrainingNominationDetails():: error occurred while getting approval pending training details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingNominationDao.getTrainingNominationDetails():: successfully get pending approval training details ...');
					var rslt = result[0];
					var schdate = rslt.SCHEDULED_DATE;
		  			var sdate = dateFormat(schdate, "yyyy-mm-dd");
		  			
		  			schdate = rslt.CREATED_DATE;
		  			var subdate = dateFormat(schdate, "yyyy-mm-dd");
		  			
		  			var training = {'trainingid': rslt.TRAINING_ID, 'trainingnominationid': rslt.TRAINING_NOMINATION_ID ,
		  			'trainingname': rslt.NAME, 'scheduleddate': sdate, 'duration': rslt.DURATION, 'firstname': rslt.FIRST_NAME,
		  			'lastname': rslt.LAST_NAME, 'subscribeddate': subdate, 'userid': rslt.USER_ID, 'userprimaryid': rslt.ID, 
		  			'description': rslt.DESCRIPTION};
					//console.log(training);
					self.emit("success", training);
					con.end();
				}
			});
		}
	});
}

TrainingNominationDao.prototype.approveOrRejectTrainingNomination=function(trainingid, nominationid, userprimaryid, approveReject, mgrprimaryid, updatedby){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingNominationDao.approveOrRejectTrainingNomination():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingNominationDao.approveOrRejectTrainingNomination():: Successfully got DB connection ..');
			console.log('trainingid: '+trainingid+', nominationid: '+nominationid+', userprimaryid: '+userprimaryid+', approveReject: '+approveReject+', mgrprimaryid: '+mgrprimaryid+', updatedby: '+updatedby);
			var sql = "UPDATE TRAINING_NOMINATION SET APPROVAL_PENDING='N', APPROVED_DENIED=?, APPROVED_DENIED_BY=?, UPDATED_BY=?, UPDATED_DATE=? "+
					   "WHERE TRAINING_NOMINATION_ID=? AND USER_ID=? AND TRAINING_ID=?";

 		    var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			
			con.query(sql, [approveReject, mgrprimaryid, updatedby, fdate, nominationid, userprimaryid, trainingid], function(err, result){
				if(err){
					console.log('TrainingNominationDao.approveOrRejectTrainingNomination():: error occurred while updating training nomination details in DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingNominationDao.getTrainingNominationDetails():: successfully updated approval details in db ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}

TrainingNominationDao.prototype.getSubscribedUserDetailsForTrainingId=function(trainingid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingNominationDao.getSubscribedUserDetailsForTrainingId():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingNominationDao.getSubscribedUserDetailsForTrainingId():: Successfully got DB connection ..');
			console.log('trainingid: '+trainingid);
			var sql = "SELECT TN.TRAINING_NOMINATION_ID, TN.TRAINING_ID, TN.USER_ID AS USERPRIMARYID, U.FIRST_NAME, U.LAST_NAME, U.USER_ID, "+
					  "TN.APPROVAL_PENDING, TN.APPROVED_DENIED, TN.APPROVED_DENIED_BY, TN.UPDATED_DATE, TN.ATTENDED FROM TRAINING_NOMINATION TN, USER U "+
					   "WHERE TN.USER_ID = U.ID AND TN.TRAINING_ID=?";

			con.query(sql, [trainingid], function(err, results){
				if(err){
					console.log('TrainingNominationDao.getSubscribedUserDetailsForTrainingId():: error occurred while retrieving training nomination details from DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingNominationDao.getSubscribedUserDetailsForTrainingId():: successfully got nomination details from db ...');
					var tnarr = new Array();
					for(var i=0; i<results.length; i++){
						var rslt = results[i];
						var update = rslt.UPDATED_DATE;
			  			var udate = dateFormat(update, "yyyy-mm-dd");
						var tn = {'trainingnominationid' : rslt.TRAINING_NOMINATION_ID, 'trainingid': rslt.TRAINING_ID, 'userprimaryid': rslt.USERPRIMARYID,
							'firstname': rslt.FIRST_NAME, 'lastname': rslt.LAST_NAME, 'userid': rslt.USER_ID, 
							'approvalpending': rslt.APPROVAL_PENDING, 'approveddenied': rslt.APPROVED_DENIED, 'approveddate': udate, 'attended': rslt.ATTENDED};
						tnarr[i]=tn;
					}
					self.emit("success", tnarr);
					con.end();
				}
			});
		}
	});
}

TrainingNominationDao.prototype.updateTrainingAttendance=function(trainingid, nominationid, userprimaryid, attended, updatedby){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("TrainingNominationDao.updateTrainingAttendance():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('TrainingNominationDao.updateTrainingAttendance():: Successfully got DB connection ..');
			console.log('trainingid: '+trainingid+', nominationid: '+nominationid+', userprimaryid: '+userprimaryid+', attended: '+attended+', updatedby: '+updatedby);
			var sql = "UPDATE TRAINING_NOMINATION SET ATTENDED=?, UPDATED_BY=?, UPDATED_DATE=? "+
					   "WHERE TRAINING_NOMINATION_ID=? AND USER_ID=? AND TRAINING_ID=?";

 		    var date = new Date();
		  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			
			con.query(sql, [attended, updatedby, fdate, nominationid, userprimaryid, trainingid], function(err, result){
				if(err){
					console.log('TrainingNominationDao.updateTrainingAttendance():: error occurred while updating training attendance details in DB... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('TrainingNominationDao.updateTrainingAttendance():: successfully updated attendance details in db ...');
					self.emit("success");
					con.end();
				}
			});
		}
	});
}
