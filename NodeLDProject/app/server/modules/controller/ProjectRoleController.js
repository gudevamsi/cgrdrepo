var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var ProjectRoleDao = require('../dao/ProjectRoleDao');

module.exports = ProjectRoleController;
Util.inherits(ProjectRoleController, EventEmitter);
function ProjectRoleController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

ProjectRoleController.prototype.displayAddProjectRole=function(req, res){
	var self = this;
	res.render('projectrole/add');
}

ProjectRoleController.prototype.handleAddProjectRole=function(req, res){
	var self = this;
	var projrolename = req.body.projrolename.trim();
	var projroledesc = req.body.projroledesc.trim();
		
	console.log('ProjectRoleController.handleAddProjectRoleRole():: Received details are: ');
	console.log('projrolename: '+projrolename+', projroledesc: '+projroledesc);
	
	var projectRoleJson = [];
	projectRoleJson.push({id: 'projrolename', 'value': projrolename});
	projectRoleJson.push({id: 'projroledesc', 'value': projroledesc});
	
	var errorJson = [];
	
	if(projrolename==null || projrolename==''){
		errorJson.push({id: 'projrolename', value: 'Project Role Name is required.'});
	}
	
	if(projroledesc==null || projroledesc==''){
		errorJson.push({id: 'projroledesc', value: 'Project Role Description is required.'});
	}
	
	console.log('ProjectRoleController.handleAddProjectRole():: errors: '+errorJson.length+'-------'+errorJson);
	if(errorJson.length > 0){
		console.log('ProjectRoleController.handleAddProjectRole():: Tring to load designation as validation error exist in input data ...');
		res.render('projectrole/add', {'errorJson': errorJson, 'projectRoleJson' : projectRoleJson});		
	}
	else{
		var projectrole = {'projrolename': projrolename, 'projroledesc': projroledesc, 'createdby': req.session.user_id};
		var dao = new ProjectRoleDao(self.mysqlconpool);
		dao.insertProjectRole(projectrole);
		
		dao.on('error', function(err){
			console.log('ProjectRoleController.handleAddProjectRole():: Error: '+err);
			res.render('error', {'action': 'inserting project role details in DB', 'error': err});
		});
		
		dao.on("success", function(id){
			console.log('ProjectRoleController.handleAddProjectRole():: Received success insert event ...');
			res.render('handleAjaxRequest', {'projroleid' :id, 'from' :'addprojectrole'});
			//res.end();
		});
	}
}

ProjectRoleController.prototype.displayViewProjectRole=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectRoleController.displayViewProjectRole():: query: '+query);
	var id = query['projroleid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('ProjectRoleController.displayViewProjectRole():: project id is required ...');
		res.render('error', {'action': 'retrieving project details.', 'error': 'project id is required'});
	}
	else{
		var dao = new ProjectRoleDao(self.mysqlconpool);
		dao.getProjectRoleById(id.trim());
		
		dao.on('error', function(err){
			console.log('ProjectRoleController.displayViewProjectRole():: Error occurred while retrieving project role id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving project role details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('ProjectRoleController.displayViewProjectRole():: project role id('+id+') is invalid id ...');
			res.render('error', {'action': 'retrieving project role details from DB.', 'error': 'project role id('+id+') is not valid id.'});
		});
		
		dao.on('exist', function(projectrole){
			console.log('ProjectRoleController.displayViewProjectRole()::  successfully retrieved project role details ...');
			res.render('projectrole/view', {'projectrole': projectrole, 'action': action});
		});
	}
}

ProjectRoleController.prototype.displayViewAllProjectRoles=function(req, res){
	var self = this;
	var dao = new ProjectRoleDao(self.mysqlconpool);
	dao.getAllProjectRoles();
	dao.on('error', function(err){
		console.error('ProjectRoleController.displayViewAllProjectRoles():: Error: '+err);
		res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("ProjectRoleController.displayViewAllProjectRoles():: received success event ...");
		console.log(arr);
		res.render('projectrole/viewall', {'projectroles': arr});
	});
}

ProjectRoleController.prototype.validateProjectRoleName = function(req, res){
	var self = this;
	var projrolename = req.body.projrolename.trim();
	var dao = new ProjectRoleDao(self.mysqlconpool);
	dao.getProjectRoleByName(projrolename);
	dao.on('error', function(err){
		console.error('ProjectRoleController.validateProjectRoleName():: Error: '+err);
		res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
	});
	
	dao.on("notexist", function(){
		console.log("ProjectRoleController.validateProjectRoleName():: received notexist event ...");
		res.render('handleAjaxRequest', {'from' : 'validateprojectrolename', 'projectrolename' : 'notexist'});
	});
	
	dao.on("exist", function(projectrole){
		console.log("ProjectRoleController.validateProjectRoleName():: received notexist event ...");
		res.render('handleAjaxRequest', {'from' : 'validateprojectrolename', 'projectrolename' : 'exist'});
	});
}

ProjectRoleController.prototype.displayModifyProjectRole=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectRoleController.displayModifyProjectRoleRole():: query: '+query);
	var id = query['projroleid'];
	if(id ==null || id.trim()==''){
		console.log('ProjectRoleController.displayModifyProjectRole():: project role id is required ...');
		res.render('error', {'action': 'retrieving project details.', 'error': 'Project Role Id is required'});
	}
	else{
		var dao = new ProjectRoleDao(self.mysqlconpool);
		dao.getProjectRoleById(id);
		
		dao.on("error", function(err){
			console.log('ProjectRoleController.displayModifyProjectRole():: Error occurred while retrieving project role details for id('+id+') ... Error is: '+err);
			res.render('error', {'action': 'retrieving project role details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(err){
			console.log('ProjectRoleController.displayModifyProjectRole():: Project Role details are not found in DB for id('+id+') ... ');
			res.render('error', {'action': 'retrieving project role details from DB.', 'error': 'Invalid project role id('+id+')'});
		});

		dao.on("exist", function(data){
			console.log('ProjectRoleController.displayModifyProjectRole():: successfully retrieved project role details ...');
			console.log(data);
			res.render('projectrole/modify', {'projectrole': data});
		});
	}
}

ProjectRoleController.prototype.handleModifyProjectRole=function(req, res){
	var self = this;
	var projroleid = req.body.projroleid.trim();
	var projrolename = req.body.projrolename.trim();
	var projroledesc = req.body.projroledesc.trim();
	
	console.log('ProjectRoleController.handleModifyProjectRoleRole() ...');
	console.log(projroleid+'-->'+projrolename+'-->'+projroledesc);
	
	var old_projrolename = req.body.old_projrolename.trim();
	var old_projroledesc = req.body.old_projroledesc.trim();
		
	console.log(old_projrolename+'-->'+old_projroledesc);
	
	var errorJson = [];
	if(projrolename==null || projrolename==''){
		errorJson.push({'id': 'projrolename', 'value': 'Project Role Name is required.'});
	}
	
	if(projroledesc==null || projroledesc==''){
		errorJson.push({'id': 'projroledesc', 'value': 'Project Role Description is required.'});
	}
	
	console.log('ProjectRoleController.handleModifyProjectRole():: errors: '+errorJson);
	if(errorJson.length==0){
		if(projrolename == old_projrolename && projroledesc == old_projroledesc){
			errorJson.push({'id': 'globalerror', 'value': 'Atleast change one value.'});
		}
	}
	console.log('ProjectRoleController.handleModifyProjectRole():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var projRoleJson = new Array();
		projRoleJson.push({'id': 'projroleid', 'value': projroleid});
		projRoleJson.push({'id': 'projrolename', 'value': projrolename}); 
		projRoleJson.push({'id': 'projroledesc', 'value': projroledesc}); 
		console.log(projRoleJson);
		
		var  oldProjRoleJson = {'projroleid': projroleid, 'projrolename': old_projrolename, 'projroledesc': old_projroledesc};
		console.log(oldProjRoleJson);
		 
		res.render('projectrole/modify', {'projRoleJson': projRoleJson, 'oldProjRoleJson' : oldProjRoleJson, 'errorJson': errorJson});
	}
	else{
		//Need to update in DB
		var projectrole = {'projroleid': projroleid, 'projrolename': projrolename, 'projroledesc': projroledesc, 'updatedby': req.session.user_id};
		console.log('ProjectRoleController.handleModifyProjectRole():: Trying to update project role details in DB..');
		var dao = new ProjectRoleDao(self.mysqlconpool);
			
		dao.updateProjectRole(projectrole);
		
		dao.on('error', function(err){
			console.log('ProjectRoleController.handleModifyProjectRole():: error occurred while updating the porject role details ... Error: '+err);
			res.render('error', {'action': 'updating project role details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('ProjectRoleController.handleModifyProjectRole():: received success event ... ');
			res.render('success', {'action': 'Update Project Role', 'message': 'Successfully updated project role details for project role name: '+projrolename});
		});
	}
}

ProjectRoleController.prototype.handleDeleteProjectRole=function(req, res){
	var self = this;
	var url = require('url');
	console.log('ProjectRoleController.handleDeleteProjectRole():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('ProjectRoleController.handleDeleteProjectRole():: query: '+query);
	var id = query['projroleid'];
	
	var dao = new ProjectRoleDao(self.mysqlconpool);
	
	console.log('ProjectRoleController.handleDeleteProjectRole():: Trying to delete id: '+id);
	dao.deleteProjectRoleById(id, req.session.user_id);
	dao.on('error', function(err){
		console.log('ProjectRoleController.handleDeleteProjectRole():: error occurred while deleting project role details ... Error: '+err);
		res.render('error', {'action': 'deleting project role details from DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('ProjectRoleController.handleDeleteProjectRole():: received success event ... ');
		res.render('success', {'action': 'Delete Project Role', 'message': 'Successfully deleted project role('+id+') details from DB.'});
	});
}