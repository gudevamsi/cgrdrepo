var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var lutil = require("../util/Util");
var constants = require('../util/constants');
var DesignationDao = require('../dao/DesignationDao');
var UserDao = require('../dao/UserDao');
var UserLoginDao = require('../dao/UserLoginDao');
var LoginDao = require('../dao/LoginDao');
var ProjectDao = require('../dao/ProjectDao');
var CertificationDao = require('../dao/CertificationDao');
var TrainingDao = require('../dao/TrainingDao');

module.exports = UserController;
Util.inherits(UserController, EventEmitter);
function UserController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

UserController.prototype.displayAddUser=function(req, res){
	var self = this;
	var desgdao = new DesignationDao(self.mysqlconpool);
	desgdao.getAll();
	desgdao.on("error", function(err){
		console.log('UserController.displayAddUser():: Unable to retrieve desination values from db ... Error is: '+err);
	});

	desgdao.on("data", function(data){
		console.log('UserController.displayAddUser():: received data ...');
		res.render('user/add', {designationarr: data});
	});
}

UserController.prototype.handleAddUser=function(req, res){
	var self = this;
	var userid = req.body.userid.trim();
	var password = req.body.password.trim();
	var repassword = req.body.repassword.trim();
	var firstname = req.body.firstname.trim();
	var lastname = req.body.lastname.trim();
	var designation = req.body.designation.trim();
	var manager = req.body.manager.trim();
	var role = req.body.role.trim();
	console.log('UserController.handleAddUser():: Received details are: ');
	console.log('userid: '+userid+', firstname: '+firstname+', lastname: '+lastname+', designation: '+designation+', manager: '+manager+', role: '+role);
	
	var userJson = [];
	userJson.push({id: 'userid', 'value': userid});
	userJson.push({id: 'password', 'value': password});
	userJson.push({id: 'repassword', 'value': repassword});
	userJson.push({id: 'firstname', 'value': firstname});
	userJson.push({id: 'lastname', 'value': lastname});
	userJson.push({id: 'designation', 'value': designation});
	userJson.push({id: 'manager', 'value': manager});
	userJson.push({id: 'role', 'value': role});
	
	var errorJson = [];
	
	if(userid==null || userid==''){
		errorJson.push({id: 'userid', value: 'Userid is required.'});
	}
	
	if(password==null || password==''){
		errorJson.push({id: 'password', value: 'Password is required.'});
	}
	
	if(repassword==null || repassword==''){
		errorJson.push({id: 'repassword', value: 'Re-password is required.'});
	}
	
	if(password!=null && password!='' && repassword!=null && repassword!=''){
		if(password != repassword){
			errorJson.push({id: 'password', value: 'Password and Re-password should be same.'});
		}
	}
	
	if(firstname==null || firstname==''){
		errorJson.push({id: 'firstname', value: 'First Name is required.'});
	}
	
	if(lastname==null || lastname==''){
		errorJson.push({id: 'lastname', value: 'Last Name is required.'});
	}
	
	if(designation==null || designation==''){
		errorJson.push({id: 'designation',value: 'Designation is required.'});
	}
	
	if(role==null || role==''){
		errorJson.push({id: 'role', value: 'Role is required.'});
	}
	console.log('UserController.handleAddUser():: errors: '+errorJson.length+'-------'+errorJson);
	if(errorJson.length > 0){
		console.log('UserController.handleAddUser():: Tring to load designation as validation error exist in input data ...');
		var desgdao = new DesignationDao(self.mysqlconpool);
		desgdao.getAll();
		desgdao.on("error", function(err){
			console.error('UserController.handleAddUser():: Unable to retrieve desination values from db ... Error is: '+err);
		});

		desgdao.on("data", function(data){
			console.log('UserController.handleAddUser():: received data ...');
			res.render('user/add', {'designationarr': data, 'errorJson': errorJson, 'userJson' : userJson});
		});			
	}
	else{
		var dao = new UserDao(self.mysqlconpool);
		if(manager=='')
			manager=null;
		var user = {'userid': userid, 'firstname': firstname, 'lastname' :lastname, 'designation': designation,
					'managerid':manager ,'role':role, 'createdby':req.session.user_id};
		dao.insertUser(user);
		dao.on('error', function(err){
			console.log('UserController.handleAddUser():: Error: '+err);
			res.render('error', {'action': 'inserting user details in DB.', 'error': err});
		});
		
		dao.on("success", function(id){
			var ndao = new UserLoginDao(self.mysqlconpool);
			var userlogin = {'userid':parseInt(id), 'password': password, 'createdby':req.session.user_id};
			console.log(userlogin);
			ndao.insertUserLogin(userlogin);
			
			ndao.on('error', function(err){
				console.log('UserController.handleAddUser():: Error: '+err);
				res.render('error', {'action': 'inserting user details in DB', 'error': err});
			});
			
			ndao.on("success", function(id){
				console.log('UserController.handleAddUser():: Received successinsert event ...');
				res.render('handleAjaxRequest', {'userid' :id, 'from' :'adduser'});
				//res.end();
			});
		
		});
	}
}

UserController.prototype.displayViewAllUsers=function(req, res){
	var self = this;
	var dao = new UserDao(self.mysqlconpool);
	dao.getAllUsers();
	dao.on('error', function(err){
		console.error('UserController.displayViewAllUsers():: Error: '+err);
		res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
	});
	
	dao.on("success", function(arr){
		console.log("UserController.displayViewAllUsers():: received success event ...");
		//console.log(arr);
		res.render('user/viewall', {'users': arr});
	});
}

UserController.prototype.displayViewUser=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('UserController.displayViewUser():: query: '+query);
	var id = query['userid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('UserController.displayViewUser():: userid is required ...');
		res.render('error', {'action': 'retrieving user details.', 'error': 'Userid is required'});
	}
	else{
		var dao = new LoginDao(self.mysqlconpool);
		dao.getUserById(id.trim(), null);
		
		dao.on('error', function(err){
			console.log('UserController.displayViewUser():: Error occurred while retrieving id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('UserController.displayViewUser():: userid('+id+') is invalid user id ...');
			res.render('error', {'action': 'retrieving user details from DB.', 'error': 'userid('+id+') is not valid userid.'});
		});
		
		dao.on('exist', function(usr){
			console.log('UserController.displayViewUser()::  successfully retrieved user details ...');
			res.render('user/view', {'user': usr, 'action': action});
		});
	}
}

UserController.prototype.displayModifyUser=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('------query: '+query);
	var id = query['userid'];
	if(id ==null || id.trim()==''){
		console.log('UserController.displayModifyUser():: error occurred while getting DB connection .. error is: '+err);
		res.render('error', {'action': 'retrieving user details.', 'error': 'Userid is required'});
	}
	else{
		var desgdao = new DesignationDao(self.mysqlconpool);
		desgdao.getAll();
		desgdao.on("error", function(err){
			console.log('UserController.displayModifyUser():: Unable to retrieve desination values from db ... Error is: '+err);
			res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
		});

		desgdao.on("data", function(data){
			var dao = new LoginDao(self.mysqlconpool);
			dao.getUserById(id.trim(), null);
			
			dao.on('error', function(err){
				console.log('UserController.displayModifyUser():: Error occurred while retrieving id('+id+') details ... error is: '+err);
				res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
			});
			
			dao.on("notexist", function(){
				console.log('UserController.displayModifyUser():: userid('+id+') is invalid user id ...');
				res.render('error', {'action': 'retrieving user details from DB.', 'error': 'userid('+id+') is not valid userid.'});
			});
			
			dao.on('exist', function(usr){
				console.log('UserController.displayModifyUser():: successfully retrieved user details ...');
				console.log(usr);
				res.render('user/modify', {'user': usr, 'designationarr': data});
			});
		});
	}
}


UserController.prototype.handleModifyUser=function(req, res){
	var self = this;
	var userid = req.body.userid.trim();
	var firstname = req.body.firstname.trim();
	var lastname = req.body.lastname.trim();
	var designation = req.body.designation.trim();
	var manageruserid = req.body.manager.trim();
	var role = req.body.role.trim();
	
	var desgname = req.body.designationname.trim();
	console.log('UserController.handleModifyUser() ...');
	console.log(firstname+'-->'+lastname+'-->'+designation+'-->'+desgname+'-->'+manageruserid+'-->'+role);
	
	var old_firstname = req.body.old_firstname.trim();
	var old_lastname = req.body.old_lastname.trim();
	var old_designation = req.body.old_designation.trim();
	var old_manageruserid = req.body.old_manageruserid.trim();
	var old_role = req.body.old_role.trim();
	console.log(old_firstname+'-->'+old_lastname+'-->'+old_designation+'-->'+old_manageruserid+'-->'+old_role);
	
	var errorJson = [];
	if(firstname==null || firstname==''){
		errorJson.push({'id': 'firstname', 'value': 'Firstname is required.'});
	}
	if(lastname==null || lastname==''){
		errorJson.push({'id': 'lastname', 'value': 'Lastname is required.'});
	}
	if(designation==null || designation==''){
		errorJson.push({'id': 'designation', 'value': 'Designation is required.'});
	}
	if(role==null || role==''){
		errorJson.push({'id': 'role', 'value': 'Role is required.'});
	}
	console.log('UserController.handleModifyUser():: errors: '+errorJson);
	if(errorJson.length==0){
		if(firstname == old_firstname && lastname == old_lastname && desgname == old_designation && manageruserid == old_manageruserid
			&& role == old_role){
			errorJson.push({'id': 'globalerror', 'value': 'Atleast change one value.'});
		}
	}
	console.log('UserController.handleModifyUser():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var userJson = {'userid': userid, 'firstname': firstname, 'lastname': lastname, 'designation' : desgname, 'manageruserid': manageruserid, 'role' : role};
		var oldUserJson = {'firstname': old_firstname, 'lastname': old_lastname, 'designation' : old_designation, 'manageruserid': old_manageruserid, 'role' : old_role};
		
		var desgdao = new DesignationDao(self.mysqlconpool);
		desgdao.getAll();
		desgdao.on("error", function(err){
			console.error('UserController.handleModifyUser():: Unable to retrieve desination values from db ... Error is: '+err);
			res.render('error', {'action': 'retrieving user details from DB.', 'error': err});
		});

		desgdao.on("data", function(data){
			console.log('UserController.handleModifyUser():: Received designation data... ');
			res.render('user/modify', {'user': userJson, 'designationarr': data, 'oldUserJson' : oldUserJson, 'errorJson': errorJson});
		});
	}
	else{
		//Need to update in DB
		if(manageruserid=='')
			manageruserid=null;
		var user = {'userid': userid, 'firstname': firstname, 'lastname': lastname, 'designation' : designation, 'manageruserid': manageruserid, 'role' : role, 'updatedby': req.session.user_id};
		console.log('UserController.handleModifyUser():: Trying to update user details in DB..');
		var dao = new UserDao(self.mysqlconpool);
			
		dao.updateUser(user);
		
		dao.on('error', function(err){
			console.log('UserController.handleModifyUser():: error occurred while updating the user details ... Error: '+err);
			res.render('error', {'action': 'updating user details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('UserController.handleModifyUser():: received success event ... ');
			res.render('success', {'action': 'Update User', 'message': 'Successfully updated details for userid: '+userid});
		});
	}
}

UserController.prototype.handleDeleteUser=function(req, res){
	var self = this;
	var url = require('url');
	console.log('UserController.handleDeleteUser():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('router.post.deleteuser:: query: '+query);
	var id = query['userid'];
	
	var dao = new UserDao(self.mysqlconpool);
	
	console.log('UserController.handleDeleteUser():: Trying to delete id: '+id);
	dao.deleteUserById(id);
	dao.on('error', function(err){
		console.log('UserController.handleDeleteUser():: error occurred while deleting the user details ... Error: '+err);
		res.render('error', {'action': 'deleting user details in DB.', 'error': err});
	});
	
	dao.on('success', function(){
		console.log('UserController.handleDeleteUser():: received success event ... ');
		res.render('success', {'action': 'Delete User', 'message': 'Successfully deleted user('+id+') details from DB.'});
	});
}

UserController.prototype.getUsersByProjectId=function(req, res){
	var self = this;
	var projectid = req.body.projectid;
	console.log('UserController.getUsersByProjectId():: getUsersByProjectId: project id  is: '+projectid);
	
	var dao = new UserDao(self.mysqlconpool);
	dao.getUsersByProjectId(projectid);
	
	dao.on("error", function(err){
		console.error('UserController.getUsersByProjectId():: Error: '+err);
		res.render('handleAjaxRequest', {'from' : 'getUsersByProjectId', 'error' : err});
	});	
	
	dao.on("success", function(data){
		console.log('UserController.getUsersByProjectId():: success  ...');
		res.contentType('json');
		res.send({ 'users' : data});
	});
}

UserController.prototype.getReportedUsers=function(req, res){
	var self = this;
	var mgrid = req.session.user_primary_id;
	console.log('UserController.getReportedUsers():: manager id  is: '+mgrid);
	
	var dao = new UserDao(self.mysqlconpool);
	dao.getReportedUsers(mgrid);
	
	dao.on("error", function(err){
		console.error('UserController.getReportedUsers():: Error: '+err);
		res.render('error', {'action': 'retrieving reported users.', 'error': err});
	});
	
	dao.on("success", function(data){
		console.log('UserController.getReportedUsers():: success  ...');
		res.render('user/reportedusers', {'users': data});
	});
}

UserController.prototype.viewUserSummary=function(req, res){
	var self = this;
	var url = require('url');
	console.log('UserController.viewUserSummary():: url: '+req.url);
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var userid = query['userid'];
	
	console.log('UserController.viewUserSummary():: user id  is: '+userid);
	
	var dao = new LoginDao(self.mysqlconpool);
	dao.getUserById(userid);
	
	dao.on("error", function(err){
		console.error('UserController.viewUserSummary():: Error: '+err);
		res.render('error', {'action': 'retrieving users summary details.', 'error': err});
	});
	
	dao.on("exist", function(data){
		console.log('UserController.viewUserSummary():: success  ...');
		
		var dao1 = new ProjectDao(self.mysqlconpool);
		dao1.getAllUserProjects(userid);
		
		dao1.on("error", function(err){
			console.error('UserController.viewUserSummary():: Error: '+err);
			res.render('error', {'action': 'retrieving project details.', 'error': err});
		});
		
		dao1.on("projsuccess", function(projarr){
			console.log('UserController.viewUserSummary():: received projsuccess event ...');
			
			var projidarr = new Array();
			for(var i=0; i<projarr.length; i++){
				projidarr[i] = projarr[i].projid;
			}
			if(projidarr.length==0){
				getCertificationDetailsForUser(self, req, res, userid, data, projarr, new Array());
				//res.render('user/usersummary', {'user': data, 'projarr': projarr, 'projapparr': new Array()});
			}
			else{
				var dao2 = new ProjectDao(self.mysqlconpool);
				dao2.getProjectAppreciationForUser(projidarr, userid);
			
				dao2.on("error", function(err){
					console.error('UserController.viewUserSummary():: Error: '+err);
					res.render('error', {'action': 'retrieving appreciation summary details.', 'error': err});
				});
		
				dao2.on("appsuccess", function(projapparr){
					console.log('UserController.viewUserSummary():: received appsuccess event ...');
					getCertificationDetailsForUser(self, req, res, userid, data, projarr, projapparr);
				});
			}
		});
	});
}

function getCertificationDetailsForUser(self, req, res, userid, userdata, projarr, projapparr){
	var dao = new CertificationDao(self.mysqlconpool);
	dao.getAllCertificationForUser(userid);
	dao.on("error", function(err){
		console.error('UserController.getCertificationDetailsForUser():: Error: '+err);
		res.render('error', {'action': 'retrieving certification details.', 'error': err});
	});

	dao.on("success", function(certarr){
		console.log('UserController.getCertificationDetailsForUser():: received sucess event ...');
		
		var dao1 = new TrainingDao(self.mysqlconpool);
		dao1.getAllAttendedTrainingsForUser(userid);
		
		dao1.on("error", function(err){
			console.error('UserController.getCertificationDetailsForUser():: Error: '+err);
			res.render('error', {'action': 'retrieving attended training details.', 'error': err});
		});
		
		dao1.on("trasuccess", function(trainingarr){
			console.log('UserController.getCertificationDetailsForUser():: received trasuccess event ...');
			console.log(trainingarr);
			res.render('user/usersummary', {'user': userdata, 'projarr': projarr, 'projapparr': projapparr, 'certarr': certarr, 'trainingarr': trainingarr});
		});
	});
}