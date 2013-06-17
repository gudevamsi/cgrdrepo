var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var lutil = require("../util/Util");
var constants = require('../util/constants');
var TrainingDao = require('../dao/TrainingDao');
var ProjectDao = require('../dao/ProjectDao');

module.exports = DashboardController;
Util.inherits(DashboardController, EventEmitter);
function DashboardController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

DashboardController.prototype.showUserDashboard=function(req, res){
	var self = this;
	var dao = new TrainingDao(self.mysqlconpool);
	dao.getAllFutureTrainings(req.session.user_id);
	
	dao.on('error', function(err){
		console.log('DashboardController.showUserDashboard():: Error occurred while retrieving future training details ... error is: '+err);
		res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
	});
	
	dao.on('success', function(result){
		console.log('DashboardController.showUserDashboard():: successfully retrieved all future trainings ...');
		console.log('Trying to retrieve all future subscribed training ...');
		dao.getFutureSubscribedTrainings(req.session.user_id);
		
		dao.on('error', function(err){
			console.log('DashboardController.showUserDashboard():: Error occurred while retrieving future subscribed training details ... error is: '+err);
			res.render('error', {'action': 'retrieving subscribed training details from DB.', 'error': err});
		});
		
		dao.on('subscribesuccess', function(subresult){
			console.log('DashboardController.showUserDashboard():: successfully retrieved all future subscribed trainings ...');
			var dao = new ProjectDao(self.mysqlconpool);
			dao.getAllAppreciationByUserId(req.session.user_id);
			dao.on('error', function(err){
				console.log('DashboardController.showUserDashboard():: Error occurred while retrieving future training details ... error is: '+err);
				res.render('error', {'action': 'retrieving training details from DB.', 'error': err});
			});
			
			dao.on('success', function(appreciations){
				console.log('DashboardController.showUserDashboard():: successfully retrieved all future trainings ...');
			res.render('userdashboard', {'trainingdetails': result, 'subscribedtrainings' : subresult,'appreciations':appreciations});
		});	
	});	
});
}

DashboardController.prototype.showManagerDashboard=function(req, res){
	var self = this;
	var dao = new TrainingDao(self.mysqlconpool);
	dao.getAllPendingApprovalTrainings(req.session.user_primary_id);
	
	dao.on('error', function(err){
		console.log('DashboardController.showManagerDashboard():: Error occurred while retrieving pending approval training details ... error is: '+err);
		res.render('error', {'action': 'retrieving pending approval training details from DB.', 'error': err});
	});
	
	dao.on('success', function(result){
		console.log('DashboardController.showUserDashboard():: successfully retrieved all pending approval trainings ...');
		res.render('managerdashboard', {'approvalpendingdetails': result});	
	});	
}