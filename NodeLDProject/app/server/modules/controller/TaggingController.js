var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var ProjectRoleDao = require('../dao/ProjectRoleDao');


var UserDao = require('../dao/UserDao');
var ProjectDao = require('../dao/ProjectDao');
var UserProjectDao = require('../dao/UserProjectDao');



module.exports = TaggingController;
Util.inherits(TaggingController, EventEmitter);
function TaggingController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}



TaggingController.prototype.displayAddTagging=function(req, res){
	var self = this;
	var userdao = new UserDao(self.mysqlconpool);
	userdao.getAllUsers();
	userdao.on("error", function(err){
			console.log('TaggingController.displayAddTagging():: Unable to retrieve user values from db ... Error is: '+err);
			res.render('error', {'action': 'retrieving details from DB.', 'error': err});
		});

	userdao.on("success", function(usr){
		var dao = new ProjectRoleDao(self.mysqlconpool);
		dao.getAllProjectRoles();
			
			dao.on('error', function(err){
				console.log('TaggingController.displayAddTagging():: Error occurred while retrieving  details ... error is: '+err);
				res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
			});
			
			dao.on("notexist", function(){
				console.log('TaggingController.displayAddTagging():: no project roles defined so far...');
				res.render('error', {'action': 'retrieving user details from DB.', 'error': "no projects defined"});
			});
			
			dao.on('success', function(data){
				console.log('TaggingController.displayAddTagging()::successfully retrieved all details ...');
				console.log(data);
				var dao = new ProjectDao(self.mysqlconpool);
				dao.getAllProjects();
				dao.on('error', function(err){
					console.error('TaggingController.displayAddTagging():: Error: '+err);
					res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
				});
				
				dao.on("success", function(arr){
					console.log("TaggingController.displayViewAllProjects():: received success event ...");
					//console.log(arr);
					res.render('tagging/add', {'user': usr, 'projectRoles': data,'projects': arr});
				});
				
			});
		});
}


TaggingController.prototype.handleAddTagging=function(req, res,i){
	var self = this;
	var count = req.body.count;
	var projectId = req.body.projectId;
	if(i==0){
		i++;
	}
	
		var userid = req.body['userid'+i].trim();
		var projectRole = req.body['projectRole'+i].trim();
		var startDate = req.body['startDate'+i].trim();
		var toDate = req.body['toDate'+i].trim();
		
		var userproject = {'projectId': projectId, 'userId': userid,'projectRole':projectRole,'startDate':startDate,'toDate':toDate, 'createdby': req.session.user_id,'updatedBy':req.session.user_id};
		console.log(userproject);
		var userprojectdao = new UserProjectDao(self.mysqlconpool);
		
		userprojectdao.insertUserProject(userproject);
		userprojectdao.on('error', function(err){
			console.log('TaggingController.handleAddTagging :: error occurred while deleting project role details ... Error: '+err);
			res.render('error', {'action': 'Add Tagging', 'error': err});
		});
		userprojectdao.on('success', function(data){
			if(i==count){
				
				console.log('TaggingController.handleAddTagging():: received success event ... ');
				res.render('success', {'action': 'Add Tagging', 'message': 'Successfully Tagged '+count+' resources.'});
			}else{
				var taggingController = new TaggingController(self.mysqlconpool);
				taggingController.handleAddTagging(req, res,i+1);
				
			}
		});
}

TaggingController.prototype.validateuserTagging=function(req, res){
	var self = this;
	var uid = req.body.userid;
	console.log('TaggingController.validateuserTagging():: validateuserTagging: userid is: '+uid);
	
	var dao = new UserProjectDao(self.mysqlconpool);
	dao.isUserTagged(uid);
	
	dao.on("error", function(err){
		console.error('TaggingController.validateuserTagging():: Error: '+err);
		res.render('handleAjaxRequest', {'from' : 'validateuserTagging', 'error' : err});
	});
	
	dao.on("notexist", function(){
		console.log('TaggingController.validateuserTagging():: userid('+uid+') not exist ...');
		res.render('handleAjaxRequest', {'from' : 'validateuserTagging', 'userid' : 'notTagged'});
	});
	
	dao.on("exist", function(){
		console.log('TaggingController.validateuserTagging():: userid('+uid+') exist ...');
		res.render('handleAjaxRequest', {'from' : 'validateuserTagging', 'userid' : 'tagged'});
	});
}

TaggingController.prototype.displayViewAllTagging=function(req, res){
	var self = this;
	var dao = new UserProjectDao(self.mysqlconpool);
	dao.getAllUserProject();
	dao.on('error', function(err){
		console.error('UserController.displayViewAllUsers():: Error: '+err);
		res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("UserController.displayViewAllUsers():: received success event ...");
		res.render('tagging/viewall', {'userprojects': arr});
	});
}

TaggingController.prototype.displayViewTagging=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TaggingController.displayViewTagging():: query: '+query);
	var id = query['userprojectid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('TaggingController.displayViewTagging():: userid is required ...');
		res.render('error', {'action': 'retrieving user details.', 'error': 'UserProjectID is required'});
	}
	else{
		var dao = new UserProjectDao(self.mysqlconpool);
		dao.getUserProjectById(id.trim());
		
		
		dao.on('error', function(err){
			console.log('TaggingController.displayViewTagging():: Error occurred while retrieving id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('TaggingController.displayViewTagging():: userid('+id+') is invalid user id ...');
			res.render('error', {'action': 'retrieving user details from DB.', 'error': 'userprojectid('+id+') is not valid userid.'});
		});
		
		dao.on('exist', function(usrproject){
			console.log('TaggingController.displayViewTagging()::  successfully retrieved user details ...');
			res.render('tagging/view', {'userproject': usrproject, 'action': action});
		});
	}
}


TaggingController.prototype.handleDeleteUserProject=function(req, res){
	var self = this;
	var url = require('url');
	console.log('TaggingController.handleDeleteUserProject():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('TaggingController.handleDeleteUserProject():: query: '+query);
	var id = query['userprojectid'];
	
	var dao = new UserProjectDao(self.mysqlconpool);
	
	console.log('TaggingController.handleDeleteUserProject():: Trying to delete id: '+id);
	dao.deleteUserProjectById(id);
	dao.on('error', function(err){
		console.log('TaggingController.handleDeleteUserProject():: error occurred while deleting project details ... Error: '+err);
		res.render('error', {'action': 'deleting project details from DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('TaggingController.handleDeleteUserProject():: received success event ... ');
		res.render('success', {'action': 'Delete Tagging', 'message': 'Successfully deleted tagging ('+id+') details from DB.'});
	});
}

TaggingController.prototype.displayModifyUserProject=function(req, res){
	console.log(req.session.user_id)
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('------query: '+query);
	var id = query['userprojectid'];
	if(id ==null || id.trim()==''){
		console.log('TaggingController.displayModifyUserProject():: error occurred while getting DB connection .. error is: '+err);
		res.render('error', {'action': 'retrieving user project details.', 'error': 'UserProjectid is required'});
	}
	else{
		var dao = new ProjectRoleDao(self.mysqlconpool);
		dao.getAllProjectRoles();
			
			dao.on('error', function(err){
				console.log('TaggingController.displayAddTagging():: Error occurred while retrieving  details ... error is: '+err);
				res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
			});
			
			dao.on("notexist", function(){
				console.log('TaggingController.displayAddTagging():: no project roles defined so far...');
				res.render('error', {'action': 'retrieving user details from DB.', 'error': "no projects defined"});
			});
			
			dao.on('success', function(data){
				console.log('TaggingController.displayAddTagging()::successfully retrieved all details ...');
				console.log(data);
				var dao = new ProjectDao(self.mysqlconpool);
				dao.getAllProjects();
				dao.on('error', function(err){
					console.error('ProjectController.displayViewAllProjects():: Error: '+err);
					res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
				});
				
				dao.on("success", function(arr){
					
					var dao = new UserProjectDao(self.mysqlconpool);
					dao.getUserProjectById(id.trim());
					
					
					dao.on('error', function(err){
						console.log('TaggingController.displayViewTagging():: Error occurred while retrieving id('+id+') details ... error is: '+err);
						res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
					});
					
					dao.on("notexist", function(){
						console.log('TaggingController.displayViewTagging():: userid('+id+') is invalid user id ...');
						res.render('error', {'action': 'retrieving user details from DB.', 'error': 'userprojectid('+id+') is not valid userid.'});
					});
					
					dao.on('exist', function(usrproject){
						console.log('TaggingController.displayViewTagging()::  successfully retrieved user details ...');
						res.render('tagging/modify', {'userproject': usrproject,"projects":arr,"roles":data });
					});
				});
				
			});
	}
}


TaggingController.prototype.handleModifyUserProject=function(req, res){
	var self = this;
	var userprojid = req.body.userprojid.trim();
	
	var userprojectId = req.body.projectId.trim();
	var userprojectRole = req.body.projectRole.trim();
	var startdate = req.body.startdate.trim();
	var enddate = req.body.enddate.trim();
	
	console.log('TaggingController.handleModifyUserProject() ...');
	console.log(userprojectId+'-->'+userprojectRole+'-->'+startdate+'-->'+enddate);
	
	var olduserprojectId = req.body.old_projid.trim();
	var olduserprojectRole = req.body.old_projroleid.trim();
	var oldstartdate = req.body.old_startdate.trim();
	var oldenddate = req.body.old_enddate.trim();
	
	
	console.log(olduserprojectId+'-->'+olduserprojectRole+'-->'+oldstartdate+'-->'+oldenddate);
	
	var errorJson = [];
	if(userprojectId==null || userprojectId==''){
		errorJson.push({'id': 'proj', 'value': 'Project is required.'});
	}
	if(userprojectRole==null || userprojectRole==''){
		errorJson.push({'id': 'projRole', 'value': 'Role is required.'});
	}
	if(startdate==null || startdate==''){
		errorJson.push({'id': 'startdate', 'value': 'Start Date is required.'});
	}
	if(enddate==null || enddate ==''){
		errorJson.push({'id': 'enddate', 'value': 'End Date is required.'});
	}
	console.log('TaggingController.handleModifyUserProject() :: errors: '+errorJson);
	if(errorJson.length==0){
		if(userprojectId == olduserprojectId && userprojectRole == olduserprojectRole && startdate == oldstartdate && enddate == oldenddate){
			
			errorJson.push({'id': 'globalerror', 'value': 'No change in the request.'});
		}
	}
	console.log('TaggingController.handleModifyUserProject():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var userProjectJson = {'userprojid': userprojid, 'projid': userprojectId, 'role' : userprojectRole, 'startdate': startdate, 'enddate' : enddate};
		var oldUserProjJson = {'userprojid': userprojid, 'projid': olduserprojectId, 'role' : olduserprojectRole, 'startdate': oldstartdate, 'enddate' : oldenddate};
		
		var dao = new ProjectRoleDao(self.mysqlconpool);
		dao.getAllProjectRoles();
			
			dao.on('error', function(err){
				console.log('TaggingController.displayAddTagging():: Error occurred while retrieving  details ... error is: '+err);
				res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
			});
			
			dao.on("notexist", function(){
				console.log('TaggingController.displayAddTagging():: no project roles defined so far...');
				res.render('error', {'action': 'retrieving user details from DB.', 'error': "no projects defined"});
			});
			
			dao.on('success', function(data){
				console.log('TaggingController.displayAddTagging()::successfully retrieved all details ...');
				console.log(data);
				var dao = new ProjectDao(self.mysqlconpool);
				dao.getAllProjects();
				dao.on('error', function(err){
					console.error('ProjectController.displayViewAllProjects():: Error: '+err);
					res.render('error', {'action': 'retrieving project details from DB.', 'error': err});
				});
				
				dao.on("success", function(arr){
					
			console.log('UserController.handleModifyUser():: Received designation data... ');
			res.render('tagging/modify', {'userproject': userProjectJson, "projects":arr,"roles":data, 'olduserProjJson' : oldUserProjJson, 'errorJson': errorJson});
		});
	});
	}
	else{
		//Need to update in DB
		var userProject = {'userprojid': userprojid, 'projid': userprojectId, 'role' : userprojectRole, 'startdate': startdate, 'enddate' : enddate, 'updatedby': req.session.user_id};
		
		console.log('TaggingController.handleModifyUserProject():: Trying to update projectuser details in DB..');
		var dao = new UserProjectDao(self.mysqlconpool);
		dao.updateUserProject(userProject);
		
		dao.on('error', function(err){
			console.log('TaggingController.handleModifyUserProject():: error occurred while updating the userproject details ... Error: '+err);
			res.render('error', {'action': 'updating userproject details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('TaggingController.handleModifyUserProject():: received success event ... ');
			res.render('success', {'action': 'Update UserProject', 'message': 'Successfully updated details for Tagging: '+userprojid});
		});
	}
}
