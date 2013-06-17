var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var ProjectDao = require('../dao/ProjectDao');
var UserDao = require('../dao/UserDao');


module.exports = ProjectController;
Util.inherits(ProjectController, EventEmitter);
function ProjectController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

ProjectController.prototype.displayAddProject=function(req, res){
	var self = this;
	res.render('project/add');
}

ProjectController.prototype.handleAddProject=function(req, res){
	var self = this;
	var projname = req.body.projname.trim();
	var projdesc = req.body.projdesc.trim();
	var startdate = req.body.startdate.trim();
	var enddate = req.body.enddate.trim();
	
	console.log('ProjectController.handleAddProject():: Received details are: ');
	console.log('projname: '+projname+', projdesc: '+projdesc+', startdate: '+startdate+', enddate: '+enddate);
	
	var projectJson = [];
	projectJson.push({id: 'projname', 'value': projname});
	projectJson.push({id: 'projdesc', 'value': projdesc});
	projectJson.push({id: 'startdate', 'value': startdate});
	projectJson.push({id: 'enddate', 'value': enddate});
	projectJson.push({id: 'createdby', 'value': req.session.user_id});
	
	var errorJson = [];
	
	if(projname==null || projname==''){
		errorJson.push({id: 'projname', value: 'Project Name is required.'});
	}
	
	if(projdesc==null || projdesc==''){
		errorJson.push({id: 'projdesc', value: 'Project Description is required.'});
	}
	
	if(startdate==null || startdate==''){
		errorJson.push({id: 'startdate', value: 'Start Date is required.'});
	}
	else{
		var tmp = Date.parse(startdate);
		var start = new Date(tmp);
		console.log('ProjectController.handleAddProject():: start date is: '+start);
		if(enddate!=null && enddate!=''){
			tmp = Date.parse(enddate);
			var end = new Date(tmp);
			console.log('ProjectController.handleAddProject():: end date is: '+end);
			if(start>=end){
				errorJson.push({id: 'enddate', value: 'End Date should be greater than start date.'});
			}
		}
	}
	
	console.log('ProjectController.handleAddProject():: errors: '+errorJson.length+'-------'+errorJson);
	if(errorJson.length > 0){
		console.log('ProjectController.handleAddProject():: Tring to load designation as validation error exist in input data ...');
		res.render('project/add', {'errorJson': errorJson, 'projectJson' : projectJson});		
	}
	else{
		var project = {'projname': projname, 'projdesc': projdesc, 'startdate': startdate, 'enddate': enddate, 'createdby': req.session.user_id};
		var dao = new ProjectDao(self.mysqlconpool);
		dao.insertProject(project);
		
		dao.on('error', function(err){
			console.log('ProjectController.handleAddProject():: Error: '+err);
			res.render('error', {'action': 'inserting project details in DB', 'error': err});
		});
		
		dao.on("success", function(id){
			console.log('ProjectController.handleAddProject():: Received successinsert event ...');
			res.render('success', {'action': 'Add Project Details', 'message': 'Successfully added the Project'});
			//res.end();
		});
	}
}

ProjectController.prototype.displayViewProject=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectController.displayViewProject():: query: '+query);
	var id = query['projid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('ProjectController.displayViewProject():: project id is required ...');
		res.render('error', {'action': 'retrieving project details.', 'error': 'project id is required'});
	}
	else{
		var dao = new ProjectDao(self.mysqlconpool);
		dao.getProjctById(id.trim());
		
		dao.on('error', function(err){
			console.log('ProjectController.displayViewProject():: Error occurred while retrieving id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('ProjectController.displayViewProject():: projectid('+id+') is invalid project id ...');
			res.render('error', {'action': 'retrieving project details from DB.', 'error': 'project id('+id+') is not valid project id.'});
		});
		
		dao.on('exist', function(project){
			console.log('ProjectController.displayViewProject()::  successfully retrieved project details ...');
			res.render('project/view', {'project': project, 'action': action});
		});
	}
}

ProjectController.prototype.displayViewAllProjects=function(req, res){
	var self = this;
	var dao = new ProjectDao(self.mysqlconpool);
	dao.getAllProjects();
	dao.on('error', function(err){
		console.error('ProjectController.displayViewAllProjects():: Error: '+err);
		res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("ProjectController.displayViewAllProjects():: received success event ...");
		//console.log(arr);
		res.render('project/viewall', {'projects': arr});
	});
}

ProjectController.prototype.displayModifyProject=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectController.displayModifyProject():: query: '+query);
	var id = query['projid'];
	if(id ==null || id.trim()==''){
		console.log('ProjectController.displayModifyProject():: project id is required ...');
		res.render('error', {'action': 'retrieving project details.', 'error': 'Project Id is required'});
	}
	else{
		var dao = new ProjectDao(self.mysqlconpool);
		dao.getProjctById(id);
		
		dao.on("error", function(err){
			console.log('ProjectController.displayModifyProject():: Error occurred while retrieving project details for id('+id+') ... Error is: '+err);
			res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(err){
			console.log('ProjectController.displayModifyProject():: Project details are not found in DB for id('+id+') ... ');
			res.render('error', {'action': 'retrieving project details from DB.', 'error': 'Invalid project id('+id+')'});
		});

		dao.on("exist", function(data){
			console.log('ProjectController.displayModifyProject():: successfully retrieved project details ...');
			console.log(data);
			res.render('project/modify', {'project': data});
		});
	}
}

ProjectController.prototype.handleModifyProject=function(req, res){
	var self = this;
	var projid = req.body.projid.trim();
	var projname = req.body.projname.trim();
	var projdesc = req.body.projdesc.trim();
	var startdate = req.body.startdate.trim();
	var enddate = req.body.enddate.trim();
	
	console.log('ProjectController.handleModifyProject() ...');
	console.log(projname+'-->'+projdesc+'-->'+startdate+'-->'+enddate);
	
	var old_projname = req.body.old_projname.trim();
	var old_projdesc = req.body.old_projdesc.trim();
	var old_startdate = req.body.old_startdate.trim();
	var old_enddate = req.body.old_enddate.trim();
	
	console.log(old_projname+'-->'+old_projdesc+'-->'+old_startdate+'-->'+old_enddate);
	
	var errorJson = [];
	if(projname==null || projname==''){
		errorJson.push({'id': 'projname', 'value': 'Project Name is required.'});
	}
	
	if(projdesc==null || projdesc==''){
		errorJson.push({'id': 'projdesc', 'value': 'Project Description is required.'});
	}
	
	if(startdate==null || startdate==''){
		errorJson.push({'id': 'startdate', 'value': 'Start Date is required.'});
	}
	else{
		var tmp = Date.parse(startdate);
		var start = new Date(tmp);
		console.log('ProjectController.handleAddProject():: start date is: '+start);
		if(enddate!=null && enddate!=''){
			tmp = Date.parse(enddate);
			var end = new Date(tmp);
			console.log('ProjectController.handleAddProject():: end date is: '+end);
			if(start>=end){
				errorJson.push({id: 'enddate', value: 'End Date should be greater than start date.'});
			}
		}
	}
	
	console.log('ProjectController.handleModifyProject():: errors: '+errorJson);
	if(errorJson.length==0){
		if(projname == old_projname && projdesc == old_projdesc && startdate == old_startdate && enddate == old_enddate){
			errorJson.push({'id': 'globalerror', 'value': 'Atleast change one value.'});
		}
	}
	console.log('ProjectController.handleModifyProject():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var projJson = new Array();
		projJson.push({'id': 'projid', 'value': projid});
		projJson.push({'id': 'projname', 'value': projname}); 
		projJson.push({'id': 'projdesc', 'value': projdesc}); 
		projJson.push({'id': 'startdate', 'value': startdate}); 
		projJson.push({'id': 'enddate', 'value': enddate}); 
		console.log(projJson);
		
		var  oldProjJson = {'projid': projid, 'projname': old_projname, 'projdesc': old_projdesc, 'startdate': old_startdate, 'enddate': old_enddate};
		console.log(oldProjJson);
		 
		res.render('project/modify', {'projJson': projJson, 'oldProjJson' : oldProjJson, 'errorJson': errorJson});
	}
	else{
		//Need to update in DB
		var project = {'projid': projid, 'projname': projname, 'projdesc': projdesc, 'startdate': startdate, 'enddate': enddate, 'updatedby': req.session.user_id};
		console.log('ProjectController.handleModifyProject():: Trying to update project details in DB..');
		var dao = new ProjectDao(self.mysqlconpool);
			
		dao.updateProject(project);
		
		dao.on('error', function(err){
			console.log('ProjectController.handleModifyProject():: error occurred while updating the user details ... Error: '+err);
			res.render('error', {'action': 'updating project details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('ProjectController.handleModifyProject():: received success event ... ');
			res.render('success', {'action': 'Update Project', 'message': 'Successfully updated project details for project name: '+projname});
		});
	}
}

ProjectController.prototype.handleDeleteProject=function(req, res){
	var self = this;
	var url = require('url');
	console.log('ProjectController.handleDeleteProject():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectController.handleDeleteProject():: query: '+query);
	var id = query['projid'];
	
	var dao = new ProjectDao(self.mysqlconpool);
	
	console.log('ProjectController.handleDeleteProject():: Trying to delete id: '+id);
	dao.deleteProjectById(id, req.session.user_id);
	dao.on('error', function(err){
		console.log('ProjectController.handleDeleteProject():: error occurred while deleting project details ... Error: '+err);
		res.render('error', {'action': 'deleting project details from DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('ProjectController.handleDeleteProject():: received success event ... ');
		res.render('success', {'action': 'Delete Project', 'message': 'Successfully deleted project('+id+') details from DB.'});
	});
}

ProjectController.prototype.handleAddAppreciation=function(req, res){
	var self = this;
	var projname = req.body.projname.trim();
	var user = req.body.user.trim();
	var appreciationDesc = req.body.appreciationDesc.trim();
	var appreciationBy = req.body.receivedBy.trim();
	var receiveDate = req.body.receiveDate.trim();
	
	
	console.log('ProjectController.handleAddAppreciation():: Received details are: ');
	console.log('projname: '+projname+', appreciationDesc: '+appreciationDesc+', receiveDate: '+receiveDate);
	var projectapprJson = {'projId': projname, 'userId': user,'appreciationDesc':appreciationDesc,'receiveDate':receiveDate,'appreciationBy':appreciationBy, 'createdby': req.session.user_id,'updatedBy':req.session.user_id};
	
	var errorJson = [];
	
	if(projname==null || projname==''){
		errorJson.push({id: 'projname', value: 'Project Name is required.'});
	}
	
	if(appreciationDesc==null || appreciationDesc==''){
		errorJson.push({id: 'appreciationDesc', value: 'Project Appreciation is required.'});
	}
	
	if(receiveDate==null || receiveDate==''){
		errorJson.push({id: 'receiveDate', value: 'Recieved Date is required.'});
	}
	
	
	console.log('ProjectController.handleAddAppreciation():: errors: '+errorJson.length+'-------'+errorJson);
	if(errorJson.length > 0){
		console.log('ProjectController.handleAddAppreciation():: Tring to load designation as validation error exist in input data ...');
		res.render('project/addAppreciation', {'errorJson': errorJson, 'projectapprJson' : projectapprJson});		
	}
	else{
		var project = {'projname': projname,  'appreciationDesc': appreciationDesc, 'receiveDate': receiveDate};
		var dao = new ProjectDao(self.mysqlconpool);
		dao.insertProjectAppreciation(projectapprJson);
		
		dao.on('error', function(err){
			console.log('ProjectController.handleAddAppreciation():: Error: '+err);
			res.render('error', {'action': 'inserting project details in DB', 'error': err});
		});
		
		dao.on("success", function(id){
			console.log('ProjectController.handleAddAppreciation():: Received successinsert event ...');
			res.render('success',  {'action': 'Add Appreciation', 'message': 'Successfully added appreciation for User :  '+user+' .'});
			//res.end();
		});
	}
}


ProjectController.prototype.diplayAddAppreciation=function(req, res){
	var self = this;
	var dao = new ProjectDao(self.mysqlconpool);
	dao.getAllProjects();
	dao.on('error', function(err){
		console.error('ProjectController.diplayAddAppreciation():: Error: '+err);
		res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		var userdao = new UserDao(self.mysqlconpool);
		userdao.getAllUsers();
		userdao.on("error", function(err){
			console.log('TaggingController.displayAddTagging():: Unable to retrieve user values from db ... Error is: '+err);
			res.render('error', {'action': 'retrieving details from DB.', 'error': err});
		});

	userdao.on("success", function(usr){
		console.log("ProjectController.diplayAddAppreciation():: received success event ...");
		//console.log(arr);
		res.render('project/addAppreciation', {'projects': arr,'user': usr});
	});
});
}

ProjectController.prototype.displayViewAllAppreciations=function(req, res){
	var self = this;
	var dao = new ProjectDao(self.mysqlconpool);
	dao.getAllAppreciation();
	dao.on('error', function(err){
		console.error('ProjectController.displayViewAllProjects():: Error: '+err);
		res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("ProjectController.displayViewAllProjects():: received success event ...");
		console.log(arr);
		res.render('project/viewallappreciations', {'appreciations': arr});
	});
}

ProjectController.prototype.displayModifyAppreciation=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectController.displayModifyAppreciation():: query: '+query);
	var id = query['appreciationid'];
	if(id ==null || id.trim()==''){
		console.log('ProjectController.displayModifyAppreciation():: project id is required ...');
		res.render('error', {'action': 'retrieving project details.', 'error': 'Project Id is required'});
	}
	else{
		var dao = new ProjectDao(self.mysqlconpool);
		dao.getAllAppreciationById(id);
		
		dao.on("error", function(err){
			console.log('ProjectController.displayModifyAppreciation():: Error occurred while retrieving project details for id('+id+') ... Error is: '+err);
			res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(err){
			console.log('ProjectController.displayModifyAppreciation():: Project details are not found in DB for id('+id+') ... ');
			res.render('error', {'action': 'retrieving project details from DB.', 'error': 'Invalid project id('+id+')'});
		});

		dao.on("success", function(data){
			console.log('ProjectController.displayModifyAppreciation():: successfully retrieved project details ...');
			console.log(data);
			res.render('project/modifyAppreciation', {'appreciations': data});
		});
	}
}

ProjectController.prototype.handleModifyAppreciation=function(req, res){
	var self = this;
	var apprid = req.body.apprid.trim();
	var apprby = req.body.apprby.trim();
	var apprdesc = req.body.apprdesc.trim();
	var apprdate = req.body.apprdate.trim();
	
	
	console.log('ProjectController.handleModifyAppreciation() ...');
	console.log(apprby+'-->'+apprdesc+'-->'+apprdate);
	
	var old_apprby = req.body.old_apprby.trim();
	var old_apprdesc = req.body.old_apprdesc.trim();
	var old_apprdate = req.body.old_apprdate.trim();
	
	console.log(old_apprby+'-->'+old_apprdesc+'-->'+old_apprdate);
	
	var errorJson = [];
	if(apprby==null || apprby==''){
		errorJson.push({'id': 'apprby', 'value': 'Appreciated by is required.'});
	}
	
	if(apprdesc==null || apprdesc==''){
		errorJson.push({'id': 'apprdesc', 'value': 'Appreciation Description is required.'});
	}
	
	if(apprdate==null || apprdate==''){
		errorJson.push({'id': 'apprdate', 'value': 'Appreciation received Date is required.'});
	}
	
	
	console.log('ProjectController.handleModifyAppreciation():: errors: '+errorJson);
	if(errorJson.length==0){
		if(apprby == old_apprby && apprdesc == old_apprdesc && apprdate == old_apprdate){
			errorJson.push({'id': 'globalerror', 'value': 'Atleast change one value.'});
		}
	}
	console.log('ProjectController.handleModifyAppreciation():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var projJson = new Array();
		projJson.push({'id': 'apprid', 'value': apprid});
		projJson.push({'id': 'apprby', 'value': apprby}); 
		projJson.push({'id': 'apprdesc', 'value': apprdesc}); 
		projJson.push({'id': 'apprdate', 'value': apprdate}); 
		
		console.log(projJson);
		
		var  oldProjJson = {'apprid': apprid, 'apprby': apprby, 'apprdesc': apprdesc, 'apprdate': apprdate};
		console.log(oldProjJson);
		 
		res.render('project/modifyAppreciation', {'projJson': projJson, 'oldProjJson' : oldProjJson, 'errorJson': errorJson});
	}
	else{
		//Need to update in DB
		var appreciation = {'apprid': apprid, 'apprby': apprby, 'apprdesc': apprdesc, 'apprdate': apprdate, 'updatedby': req.session.user_id};
		console.log('ProjectController.handleModifyAppreciation():: Trying to update appreciation details in DB..');
		var dao = new ProjectDao(self.mysqlconpool);
			
		dao.updateAppreciation(appreciation);
		
		dao.on('error', function(err){
			console.log('ProjectController.appreciation():: error occurred while updating the appreciation details ... Error: '+err);
			res.render('error', {'action': 'updating appreciation details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('ProjectController.appreciation():: received success event ... ');
			res.render('success', {'action': 'Update Appreciation', 'message': 'Successfully updated appreciation details '});
		});
	}
}

ProjectController.prototype.displayViewAppreciation=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectController.displayViewAppreciation():: query: '+query);
	var id = query['appreciationid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('ProjectController.displayViewAppreciation():: Appreciation id is required ...');
		res.render('error', {'action': 'retrieving Appreciation details.', 'error': 'appreciation id is required'});
	}
	else{
		var dao = new ProjectDao(self.mysqlconpool);
		dao.getAllAppreciationById(id.trim());
		
		dao.on('error', function(err){
			console.log('ProjectController.displayViewAppreciation():: Error occurred while retrieving id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('ProjectController.displayViewAppreciation():: appreciationid ('+id+') is invalid project id ...');
			res.render('error', {'action': 'retrieving appreciation details from DB.', 'error': 'appreciation id('+id+') is not valid appreciation id.'});
		});
		
		dao.on('success', function(appreciation){
			console.log('ProjectController.displayViewAppreciation()::  successfully retrieved appreciation details ...');
			res.render('project/viewAppreciation', {'appreciation': appreciation, 'action': action});
		});
	}
}

ProjectController.prototype.handleDeleteAppreciation=function(req, res){
	var self = this;
	var url = require('url');
	console.log('ProjectController.handleDeleteAppreciation():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectController.handleDeleteAppreciation():: query: '+query);
	var id = query['appreciationid'];
	
	var dao = new ProjectDao(self.mysqlconpool);
	
	console.log('ProjectController.handleDeleteAppreciation():: Trying to delete id: '+id);
	dao.deleteAppreciationById(id, req.session.user_id);
	dao.on('error', function(err){
		console.log('ProjectController.handleDeleteAppreciation():: error occurred while deleting appreciation details ... Error: '+err);
		res.render('error', {'action': 'deleting appreciation details from DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('ProjectController.handleDeleteAppreciation():: received success event ... ');
		res.render('success', {'action': 'Delete Appreciation', 'message': 'Successfully deleted Appreciation ('+id+') details from DB.'});
	});
}
