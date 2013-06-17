var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var lutil = require("../util/Util");
var constants = require('../util/constants');
var LoginDao = require('../dao/LoginDao');

module.exports = LoginController;
Util.inherits(LoginController, EventEmitter);
function LoginController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

LoginController.prototype.handleLogin=function(req, res){
	var self = this;
	var username = req.body.username;
	var password = req.body.password;
	console.log('LoginController.handleLogin():: Following user trying to login: '+username+' ...');
	if(username == null || username==undefined || lutil.trim(username)=='' || password==null || password==undefined || lutil.trim(password)=='' ){
		console.log('LoginController.handleLogin()::Either username or password are not provided ...');
		res.render('index', { 'title': constants.title, 'dojourl' : constants.dojourl, 'error': constants.login_username_password_required });
	}
	else{
		var dao = new LoginDao(self.mysqlconpool);
		dao.authenticate(username, password);
		dao.on("error", function(err){
			console.log('LoginController.handleLogin():: Error: '+err);
			res.render('index', { 'title': constants.title, 'dojourl' : constants.dojourl, 'error': 'Error: '+err });
		});
		
		dao.on("invaliduser", function(){
			console.log('LoginController.handleLogin():: Invalid User ...');
			res.render('index', { 'title': constants.title, 'dojourl' : constants.dojourl, 'error': constants.login_username_password_invalid });
		});
		
		dao.on("validuser", function(data){
			console.log('LoginController.handleLogin():: ***User('+username+') is valid user ...');
			req.session.user_id = username;
			req.session.user_role = data.role;
			req.session.user_primary_id = data.id;
			res.render('home', { 'title': constants.title, 'dojourl' : constants.dojourl, 'data': data});
		});			
	}
}

LoginController.prototype.validateUserId=function(req, res){
	var self = this;
	var uid = req.body.userid;
	console.log('LoginController.validateUserId():: validateuserid: userid is: '+uid);
	
	var dao = new LoginDao(self.mysqlconpool);
	dao.isUserIdExist(uid);
	
	dao.on("error", function(err){
		console.error('LoginController.validateUserId():: Error: '+err);
		res.render('handleAjaxRequest', {'from' : 'validateuserid', 'error' : err});
	});
	
	dao.on("notexist", function(){
		console.log('LoginController.validateUserId():: userid('+uid+') not exist ...');
		res.render('handleAjaxRequest', {'from' : 'validateuserid', 'userid' : 'notexist'});
	});
	
	dao.on("exist", function(data){
		console.log('LoginController.validateUserId():: userid('+uid+') exist ...');
		res.render('handleAjaxRequest', {'from' : 'validateuserid', 'userid' : 'exist'});
	});
}

LoginController.prototype.validateManagerUserId=function(req, res){
	var self = this;
	var userid = req.body.userid;
	console.log('LoginController.validateManagerUserId():: validateuserid: userid is: '+userid);
	
	var dao = new LoginDao(self.mysqlconpool);
	dao.getUserById(null, userid);
	
	dao.on("error", function(err){
		console.error('LoginController.validateManagerUserId():: Error: '+err);
		res.render('handleAjaxRequest', {'from' : 'validateuserid', 'error' : err});
	});
	
	dao.on("notexist", function(){
		console.log('LoginController.validateManagerUserId():: userid('+userid+') not exist ...');
		res.render('handleAjaxRequest', {'from' : 'validateuserid', 'userid' : 'invalid'});
	});
	
	dao.on("exist", function(data){
		console.log('LoginController.validateManagerUserId():: userid('+userid+') exist ...');
		console.log('LoginController.validateManagerUserId():: designation is: '+data.designation);
		if(data.designation.indexOf('M')==0){
			res.render('handleAjaxRequest', {'from' : 'validateuserid', 'userid' : 'valid'});
		}
		else{
			res.render('handleAjaxRequest', {'from' : 'validateuserid', 'userid' : 'invalid'});
		}
	});
}