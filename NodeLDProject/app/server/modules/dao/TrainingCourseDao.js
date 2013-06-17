var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = TrainingCourseDao;
Util.inherits(TrainingCourseDao, EventEmitter);
function TrainingCourseDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

TrainingCourseDao.prototype.insertTrainingCourse=function(trainingcourse){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('TRAINING_COURSE', 'TRAINING_COURSE_ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("TrainingCourseDao.insertTrainingCourse():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("TrainingCourseDao.insertTrainingCourse():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('TrainingCourseDao.insertTrainingCourse():: Successfully got connection ...'+con);
				var sql = "INSERT INTO TRAINING_COURSE (TRAINING_COURSE_ID, NAME, DESCRIPTION, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?)";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('TrainingCourseDao.insertTrainingCourse():: Date is: '+fdate);
				con.query(sql, [++id, trainingcourse.trainingname, trainingcourse.trainingdesc, trainingcourse.createdby, fdate], function(err, result){
					if(err){
						console.log("TrainingCourseDao.insertTrainingCourse():: error: "+err);
						console.log("TrainingCourseDao.insertTrainingCourse():: Failed to insert training course details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("TrainingCourseDao.insertTrainingCourse():: Successfully inserted training course details in DB ...");
						self.emit("success", id);
						console.log("TrainingCourseDao.insertTrainingCourse():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

TrainingCourseDao.prototype.updateTrainingCourse=function(trainingcourse){
	var self = this;
	
	self.mysqlconpool.getConnection(function(err, con){
	if(err){
		console.log("TrainingCourseDao.updateTrainingCourse():: Error occurred while getting connection .. Error is: "+err);
		self.emit("error", err);
		con.end();
	}
	else{
		console.log('TrainingCourseDao.updateTrainingCourse():: Successfully got connection ...');
		var sql = "UPDATE TRAINING_COURSE SET NAME=?, DESCRIPTION=?, UPDATED_BY=?, UPDATED_DATE=? WHERE TRAINING_COURSE_ID=(SELECT TRAINING_COURSE_ID FROM TRAINING WHERE TRAINING_ID=?)";
	  	var date = new Date();
	  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
	  	console.log('TrainingCourseDao.updateTrainingCourse():: Date is: '+fdate);
		con.query(sql, [trainingcourse.trainingname, trainingcourse.trainingdesc, trainingcourse.updatedby, fdate, trainingcourse.trainingid], function(err, result){
			if(err){
				console.log("TrainingCourseDao.updateTrainingCourse():: error: "+err);
				console.log("TrainingCourseDao.updateTrainingCourse():: Failed to update training course details in DB ... Error: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log("TrainingCourseDao.updateTrainingCourse():: Successfully updated training course details in DB ...");
				self.emit("success");
				console.log("TrainingCourseDao.updateTrainingCourse():: Emitted event success ..");
				con.end();
			}
		});	
	}
});
}