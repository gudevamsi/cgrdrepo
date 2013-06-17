var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var TrainingDao = require('../dao/TrainingDao');
var TrainingNominationDao = require('../dao/TrainingNominationDao');

module.exports = TrainingController;
Util.inherits(TrainingController, EventEmitter);
function TrainingController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

TrainingController.prototype.displayAddTraining=function(req, res){
	var self = this;
	res.render('training/add');
}

TrainingController.prototype.handleAddTraining=function(req, res){
	var self = this;
	var trainingname = req.body.trainingname.trim();
	var trainingdesc = req.body.trainingdesc.trim();
	var scheduleddate = req.body.scheduleddate.trim();
	var duration = req.body.duration.trim();
	var openForNomination = req.body.openForNomination.trim();
	
	console.log('TrainingController.handleAddTraining():: Received details are: ');
	console.log('trainingname: '+trainingname+', trainingdesc: '+trainingdesc+', scheduleddate: '+scheduleddate+', duration: '+duration);
	
	var trainingJson = [];
	trainingJson.push({id: 'trainingname', 'value': trainingname});
	trainingJson.push({id: 'trainingdesc', 'value': trainingdesc});
	trainingJson.push({id: 'scheduleddate', 'value': scheduleddate});
	trainingJson.push({id: 'duration', 'value': duration});
	
	var errorJson = [];
	
	if(trainingname==null || trainingname==''){
		errorJson.push({id: 'trainingname', value: 'Training Name is required.'});
	}
	
	if(trainingdesc==null || trainingdesc==''){
		errorJson.push({id: 'trainingdesc', value: 'Training Description is required.'});
	}
	
	if(scheduleddate==null || scheduleddate==''){
		errorJson.push({id: 'scheduleddate', value: 'Scheduled Date is required.'});
	}
	else{
		var tmp = Date.parse(scheduleddate);
		var start = new Date(tmp);
		console.log('TrainingController.handleAddTraining():: start date is: '+start);
		var now = new Date();
		if(now>=start){
			errorJson.push({id: 'scheduleddate', value: 'Scheduled Date should be future date.'});
		}
	}
	
	if(duration==null || duration==''){
		errorJson.push({id: 'duration', value: 'Duration is required.'});
	}
	else if(isNaN(duration)){
		errorJson.push({id: 'duration', value: 'Duration should be a number.'});
	}
	
	console.log('TrainingController.handleAddTraining():: errors: '+errorJson.length+'-------'+errorJson);
	if(errorJson.length > 0){
		console.log('TrainingController.handleAddTraining():: Tring to load designation as validation error exist in input data ...');
		res.render('training/add', {'errorJson': errorJson, 'trainingJson' : trainingJson});		
	}
	else{
		var training = {'trainingname': trainingname, 'trainingdesc': trainingdesc, 'scheduleddate': scheduleddate, 'duration': duration, 'openForNomination': openForNomination, 'createdby': req.session.user_id};
		var dao = new TrainingDao(self.mysqlconpool);
		dao.insertTraining(training);
		
		dao.on('error', function(err){
			console.log('TrainingController.handleAddTraining():: Error: '+err);
			res.render('error', {'action': 'inserting training details in DB', 'error': err});
		});
		
		dao.on("success", function(id){
			console.log('TrainingController.handleAddTraining():: Received success insert event ...');
			res.render('handleAjaxRequest', {'trainingid' :id, 'from' :'addtraining'});
			//res.end();
		});
	}
}

TrainingController.prototype.displayViewTraining=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.displayViewTraining():: query: '+query);
	var id = query['trainingid'];
	var action = query['action'];
	var approvalpending = query['approvalpending'];
	
	if(id ==null || id.trim()==''){
		console.log('TrainingController.displayViewTraining():: training id is required ...');
		res.render('error', {'action': 'retrieving training details.', 'error': 'training id is required'});
	}
	else{
		var dao = new TrainingDao(self.mysqlconpool);
		dao.getTrainingById(id.trim());
		
		dao.on('error', function(err){
			console.log('TrainingController.displayViewTraining():: Error occurred while retrieving training id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('TrainingController.displayViewTraining():: training('+id+') is invalid training id ...');
			res.render('error', {'action': 'retrieving training details from DB.', 'error': 'training id('+id+') is not valid training id.'});
		});
		
		dao.on('exist', function(training){
			console.log('TrainingController.displayViewTraining()::  successfully retrieved training details ...');
			res.render('training/view', {'training': training, 'action': action, 'userrole': req.session.user_role, 'approvalpending': approvalpending});
		});
	}
}

TrainingController.prototype.displayViewTrainingForManager=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.displayViewTrainingForManager():: query: '+query);
	var id = query['trainingid'];
	var action = query['action'];
	var approvalpending = query['approvalpending'];
	
	if(id ==null || id.trim()==''){
		console.log('TrainingController.displayViewTrainingForManager():: training id is required ...');
		res.render('error', {'action': 'retrieving training details.', 'error': 'training id is required'});
	}
	else{
		var dao = new TrainingDao(self.mysqlconpool);
		dao.getTrainingById(id.trim());
		
		dao.on('error', function(err){
			console.log('TrainingController.displayViewTrainingForManager():: Error occurred while retrieving training id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('TrainingController.displayViewTrainingForManager():: training('+id+') is invalid training id ...');
			res.render('error', {'action': 'retrieving training details from DB.', 'error': 'training id('+id+') is not valid training id.'});
		});
		
		dao.on('exist', function(training){
			console.log('TrainingController.displayViewTrainingForManager()::  successfully retrieved training details ...');
			var ndao = new TrainingNominationDao(self.mysqlconpool);
			ndao.getSubscribedUserDetailsForTrainingId(id.trim());
			ndao.on('error', function(nerr){
				console.log('TrainingController.displayViewTrainingForManager():: Error occurred while retrieving training nomination details ... error is: '+nerr);
				res.render('error', {'action': 'retrieving training nomination details from DB.', 'error': nerr});
			});
			
			ndao.on('success', function(userarr){
				console.log('TrainingController.displayViewTrainingForManager():: successfully received training nomination details ...'+userarr.length+'****');
				res.render('training/viewformgr', {'training': training, 'nominationdetails': userarr, 'role': req.session.user_role});
			});			
		});
	}
}


TrainingController.prototype.displayViewAllTrainings=function(req, res){
	var self = this;
	var dao = new TrainingDao(self.mysqlconpool);
	dao.getAllTrainings();
	dao.on('error', function(err){
		console.error('TrainingController.displayViewAllTrainings():: Error: '+err);
		res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("TrainingController.displayViewAllTrainings():: received success event ...");
		//console.log(arr);
		res.render('training/viewall', {'trainings': arr, 'userrole': req.session.user_role});
	});
}

TrainingController.prototype.displayModifyTraining=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.displayModifyTraining():: query: '+query);
	var id = query['trainingid'];
	if(id ==null || id.trim()==''){
		console.log('TrainingController.displayModifyTraining():: training id is required ...');
		res.render('error', {'action': 'retrieving project details.', 'error': 'Training Id is required'});
	}
	else{
		var dao = new TrainingDao(self.mysqlconpool);
		dao.getTrainingById(id);
		
		dao.on("error", function(err){
			console.log('TrainingController.displayModifyTraining():: Error occurred while retrieving training details for id('+id+') ... Error is: '+err);
			res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(err){
			console.log('TrainingController.displayModifyTraining():: Training details are not found in DB for id('+id+') ... ');
			res.render('error', {'action': 'retrieving training details from DB.', 'error': 'Invalid training id('+id+')'});
		});

		dao.on("exist", function(data){
			console.log('TrainingController.displayModifyTraining():: successfully retrieved training details ...');
			console.log(data);
			res.render('training/modify', {'training': data});
		});
	}
}

TrainingController.prototype.handleModifyTraining=function(req, res){
	var self = this;
	var trainingid = req.body.trainingid.trim();
	var trainingname = req.body.trainingname.trim();
	var trainingdesc = req.body.trainingdesc.trim();
	var scheduleddate = req.body.scheduleddate.trim();
	var duration = req.body.duration.trim();
	var openForNomination = req.body.openForNomination.trim();
	
	console.log('TrainingController.handleModifyTraining() ...');
	console.log(trainingid+'-->'+trainingname+'-->'+trainingdesc+'-->'+scheduleddate+'-->'+duration+'-->'+openForNomination);
	
	var old_trainingname = req.body.old_trainingname.trim();
	var old_trainingdesc = req.body.old_trainingdesc.trim();
	var old_scheduleddate = req.body.old_scheduleddate.trim();
	var old_duration = req.body.old_duration.trim();
	var old_openForNomination = req.body.old_openForNomination.trim();
	
	console.log(trainingid+'-->'+old_trainingname+'-->'+old_trainingdesc+'-->'+old_scheduleddate+'-->'+old_duration+'-->'+old_openForNomination);
	
	var errorJson = [];
	if(trainingname==null || trainingname==''){
		errorJson.push({'id': 'trainingname', 'value': 'Training Name is required.'});
	}
	
	if(trainingdesc==null || trainingdesc==''){
		errorJson.push({'id': 'trainingdesc', 'value': 'Training Description is required.'});
	}
	
	if(scheduleddate==null || scheduleddate==''){
		errorJson.push({'id': 'scheduleddate', 'value': 'Scheduled Date is required.'});
	}
	else{
		var tmp = Date.parse(scheduleddate);
		var sdate = new Date(tmp);
		var now = new Date();
		if(now >= sdate){
			errorJson.push({'id': 'scheduleddate', 'value': 'Scheduled Date should be future date.'});
		}
	}
	
	if(duration==null || duration==''){
		errorJson.push({id: 'duration', value: 'Duration is required.'});
	}
	else if(isNaN(duration)){
		errorJson.push({id: 'duration', value: 'Duration should be a number.'});
	}
	
	console.log('TrainingController.handleModifyTraining():: errors: '+errorJson);
	if(errorJson.length==0){
		if(trainingname == old_trainingname && trainingdesc == old_trainingdesc && scheduleddate == old_scheduleddate && 
			duration == old_duration && openForNomination == old_openForNomination){
			errorJson.push({'id': 'globalerror', 'value': 'Atleast change one value.'});
		}
	}
	console.log('TrainingController.handleModifyTraining():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var trainingJson = new Array();
		trainingJson.push({'id': 'trainingid', 'value': trainingid});
		trainingJson.push({'id': 'trainingname', 'value': trainingname}); 
		trainingJson.push({'id': 'trainingdesc', 'value': trainingdesc}); 
		trainingJson.push({'id': 'scheduleddate', 'value': scheduleddate}); 
		trainingJson.push({'id': 'duration', 'value': duration});
		trainingJson.push({'id': 'openForNomination', 'value': openForNomination}); 
		console.log(trainingJson);
		
		var  oldTrainingJson = {'trainingid': trainingid, 'trainingname': old_trainingname, 'trainingdesc': old_trainingdesc, 
			'scheduleddate': old_scheduleddate, 'duration': old_duration, 'openForNomination': old_openForNomination};
		console.log(oldTrainingJson);
		 
		res.render('training/modify', {'trainingJson': trainingJson, 'oldTrainingJson' : oldTrainingJson, 'errorJson': errorJson});
	}
	else{
		//Need to update in DB
		var training = {'trainingid': trainingid, 'trainingname': trainingname, 'trainingdesc': trainingdesc, 'scheduleddate': scheduleddate, 
			'duration': duration, 'openForNomination': openForNomination, 'updatedby': req.session.user_id};
		console.log('TrainingController.handleModifyTraining():: Trying to update training details in DB..');
		var dao = new TrainingDao(self.mysqlconpool);
			
		dao.updateTraining(training);
		
		dao.on('error', function(err){
			console.log('TrainingController.handleModifyTraining():: error occurred while updating the training details ... Error: '+err);
			res.render('error', {'action': 'updating training details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('TrainingController.handleModifyTraining():: received success event ... ');
			res.render('success', {'action': 'Update Training', 'message': 'Successfully updated Training details for training name: '+trainingname});
		});
	}
}

TrainingController.prototype.handleDeleteTraining=function(req, res){
	var self = this;
	var url = require('url');
	console.log('TrainingController.handleDeleteTraining():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.handleDeleteTraining():: query: '+query);
	var id = query['trainingid'];
	
	var dao = new TrainingDao(self.mysqlconpool);
	
	console.log('TrainingController.handleDeleteTraining():: Trying to delete id: '+id);
	dao.deleteTrainingById(id, req.session.user_id);
	dao.on('error', function(err){
		console.log('TrainingController.handleDeleteTraining():: error occurred while deleting training details ... Error: '+err);
		res.render('error', {'action': 'deleting training details from DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('TrainingController.handleDeleteTraining():: received success event ... ');
		res.render('success', {'action': 'Delete Training', 'message': 'Successfully deleted training('+id+') details from DB.'});
	});
}

TrainingController.prototype.subscribeForTraining=function(req, res){
	var self = this;
	var url = require('url');
	console.log('TrainingController.subscribeForTraining():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.subscribeForTraining():: query: '+query);
	var id = query['trainingid'];
	
	var dao = new TrainingNominationDao(self.mysqlconpool);
	
	console.log('TrainingController.subscribeForTraining():: Trying to insert subscribe for training for id: '+id);
	dao.insertTrainingNomination(id, req.session.user_primary_id, req.session.user_id);
	dao.on('error', function(err){
		console.log('TrainingController.subscribeForTraining():: error occurred while inserting training nomination details ... Error: '+err);
		res.render('error', {'action': 'inserting training nomination details from DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('TrainingController.subscribeForTraining():: received success event ... ');
		res.render('success', {'action': 'Subscribe Training', 'message': 'Successfully subscribed for training.'});
	});
}

TrainingController.prototype.showTrainingNomination=function(req, res){
	var self = this;
	var url = require('url');
	console.log('TrainingController.showTrainingNomination():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.showTrainingNomination():: query: '+query);
	var nominationid = query['trainingnominationid'];
	var trainingid = query['trainingid'];
	var userprimaryid = query['userprimaryid'];
	
	var dao = new TrainingNominationDao(self.mysqlconpool);
	
	console.log('TrainingController.showTrainingNomination():: Trying to insert subscribe for training for id: '+trainingid);
	dao.getTrainingNominationDetails(trainingid, nominationid, userprimaryid);
	dao.on('error', function(err){
		console.log('TrainingController.showTrainingNomination():: error occurred while getting training nomination details ... Error: '+err);
		res.render('error', {'action': 'inserting training nomination details from DB.', 'error': err});
	});
	
	dao.on('success', function(trainingnomination){
		console.log('TrainingController.showTrainingNomination():: received success event ... ');
		res.render('trainingnomination/view', {'trainingnomination': trainingnomination});
	});
}

TrainingController.prototype.approveOrRejectTrainingNomination=function(req, res){
	var self = this;
	var url = require('url');
	console.log('TrainingController.approveOrRejectTrainingNomination():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.approveOrRejectTrainingNomination():: query: '+query);
	var nominationid = query['trainingnominationid'];
	var trainingid = query['trainingid'];
	var userprimaryid = query['userprimaryid'];
	var action = query['action'];
	var approveReject = '';
	if(action=='approve'){
		approveReject='Y';
	}
	else{
		approveReject='N';
	}
	
	var dao = new TrainingNominationDao(self.mysqlconpool);
	
	console.log('TrainingController.approveOrRejectTrainingNomination():: Trying to '+approveReject+' training nomination for user: '+userprimaryid);
	dao.approveOrRejectTrainingNomination(trainingid, nominationid, userprimaryid, approveReject, req.session.user_primary_id, req.session.user_id);
	dao.on('error', function(err){
		console.log('TrainingController.approveOrRejectTrainingNomination():: error occurred while '+approveReject+' training nomination for user: '+userprimaryid+' ... Error: '+err);
		res.render('error', {'action': approveReject+'ing training nomination in DB.', 'error': err});
	});
	
	dao.on('success', function(){
		if(approveReject=='Y'){
			approveReject = 'approve';
		}
		else{
			approveReject = 'reject';
		}
		console.log('TrainingController.approveOrRejectTrainingNomination():: received success event ... ');
		res.render('success', {'action': approveReject+' training', 'message': 'Successfully '+approveReject+'ed training nomination.'});
	});
}

TrainingController.prototype.updateTrainingAttendance=function(req, res){
	var self = this;
	var url = require('url');
	console.log('TrainingController.updateAttendance():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TrainingController.updateAttendance():: query: '+query);
	var nominationid = query['trainingnominationid'];
	var trainingid = query['trainingid'];
	var userprimaryid = query['userprimaryid'];
	var attended = query['action'];
	
	var dao = new TrainingNominationDao(self.mysqlconpool);
	
	console.log('TrainingController.updateAttendance():: Trying to update training attendance('+trainingid+') for user: '+userprimaryid);
	dao.updateTrainingAttendance(trainingid, nominationid, userprimaryid, attended, req.session.user_id);
	dao.on('error', function(err){
		console.log('TrainingController.updateAttendance():: error occurred while updating training attendance('+trainingid+') for user: '+userprimaryid+' ... Error: '+err);
		res.render('error', {'action': 'updating attendance details in DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('TrainingController.updateAttendance():: received success event ... ');
		res.render('success', {'action': 'updated attendance', 'message': 'Successfully updated training attendance..'});
	});
}

TrainingController.prototype.displayallfuturetrainings=function(req, res){
	var self = this;
	var dao = new TrainingDao(self.mysqlconpool);
	dao.getAllFutureTrainings(req.session.user_id);
	dao.on('error', function(err){
		console.error('TrainingController.displayViewAllTrainings():: Error: '+err);
		res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("TrainingController.displayViewAllTrainings():: received success event ...");
		//console.log(arr);
		res.render('training/viewall', {'trainings': arr, 'userrole': req.session.user_role});
	});
}
