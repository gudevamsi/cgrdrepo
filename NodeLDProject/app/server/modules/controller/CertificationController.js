var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var CertificationDao = require('../dao/CertificationDao');

module.exports = CertificationController;
Util.inherits(CertificationController, EventEmitter);
function CertificationController(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

CertificationController.prototype.addCertification=function(req, res){
	var self = this;
	var certificationname = req.body.certificationname.trim();
	var certificationdesc = req.body.certificationdesc.trim();
	var certificationdate = req.body.certificationdate.trim();

	console.log('CertificationController.addCertification():: Received details are: ');
	console.log('certificationname: '+certificationname+', certificationdesc: '+certificationdesc+', certificationdate: '+certificationdate);
	
	var certificationJson = [];
	certificationJson.push({id: 'certificationname', 'value': certificationname});
	certificationJson.push({id: 'certificationdesc', 'value': certificationdesc});
	certificationJson.push({id: 'certificationdate', 'value': certificationdate});
	
	var errorJson = [];
	
	if(certificationname==null || certificationname==''){
		errorJson.push({id: 'certificationname', value: 'Certification Name is required.'});
	}
	
	if(certificationdesc==null || certificationdesc==''){
		errorJson.push({id: 'certificationdesc', value: 'Certification Desription is required.'});
	}
	
	if(certificationdate==null || certificationdate==''){
		errorJson.push({id: 'certificationdate', value: 'Certification Date is required.'});
	}
	
	console.log('CertificationController.addCertification():: errors: '+errorJson.length+'-------'+errorJson);
	if(errorJson.length > 0){
		console.log('CertificationController.addCertification():: Tring to load designation as validation error exist in input data ...');
		res.render('certification/add', {'errorJson': errorJson, 'certificationJson' : certificationJson});			
	}
	else{
		var dao = new CertificationDao(self.mysqlconpool);		
		dao.insertCertification(certificationname, certificationdesc, certificationdate, req.session.user_primary_id, req.session.user_id);
		dao.on('error', function(err){
			console.log('CertificationController.addCertification():: Error: '+err);
			res.render('error', {'action': 'inserting certification details in DB.', 'error': err});
		});
		
		dao.on("success", function(id){
			console.log('CertificationController.addCertification():: Received successinsert event ...');
			res.render('handleAjaxRequest', {'certificationid' :id, 'from' :'addcertification'});		
		});
	}
}

CertificationController.prototype.displayViewCertification=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('CertificationController.displayViewCertification():: query: '+query);
	var id = query['certificationid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('CertificationController.displayViewCertification():: certification id is required ...');
		res.render('error', {'action': 'retrieving certification details.', 'error': 'certification id is required'});
	}
	else{
		var dao = new CertificationDao(self.mysqlconpool);
		dao.getCertificationById(id.trim());
		
		dao.on('error', function(err){
			console.log('CertificationController.displayViewCertification():: Error occurred while retrieving certification id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving certification details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('CertificationController.displayViewCertification():: certification id('+id+') is invalid id ...');
			res.render('error', {'action': 'retrieving certification details from DB.', 'error': 'certification id('+id+') is not valid certification id.'});
		});
		
		dao.on('exist', function(certification){
			console.log('CertificationController.displayViewCertification()::  successfully retrieved certification details ...');
			res.render('certification/view', {'certification': certification, 'action': action});
		});
	}
}

CertificationController.prototype.displayViewAllCertification=function(req, res){
	var self = this;
	console.log('CertificationController.displayViewAllCertification():: start of displayViewAllCertification ...');

	var dao = new CertificationDao(self.mysqlconpool);
	dao.getAllCertificationForUser(req.session.user_primary_id);
	
	dao.on('error', function(err){
		console.log('CertificationController.displayViewAllCertification():: Error occurred while retrieving all certification details ... error is: '+err);
		res.render('error', {'action': 'retrieving all certification details from DB.', 'error': err});
	});
	
	dao.on('success', function(certificationarr){
		console.log('CertificationController.displayViewAllCertification()::  successfully retrieved all certification details ...');
		res.render('certification/viewall', {'certificationarr': certificationarr});
		console.log('rendered ...');
	});
}

CertificationController.prototype.viewModifyCertification=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('CertificationController.viewModifyCertification():: query: '+query);
	var id = query['certificationid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('CertificationController.viewModifyCertification():: certification id is required ...');
		res.render('error', {'action': 'retrieving certification details.', 'error': 'certification id is required'});
	}
	else{
		var dao = new CertificationDao(self.mysqlconpool);
		dao.getCertificationById(id.trim());
		
		dao.on('error', function(err){
			console.log('CertificationController.viewModifyCertification():: Error occurred while retrieving certification id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'retrieving certification details from DB.', 'error': err});
		});
		
		dao.on("notexist", function(){
			console.log('CertificationController.viewModifyCertification():: certification id('+id+') is invalid id ...');
			res.render('error', {'action': 'retrieving certification details from DB.', 'error': 'certification id('+id+') is not valid certification id.'});
		});
		
		dao.on('exist', function(certification){
			console.log('CertificationController.viewModifyCertification()::  successfully retrieved certification details ...');
			res.render('certification/modify', {'certification': certification, 'action': action});
		});
	}
}

CertificationController.prototype.handleModifyCertification=function(req, res){
	var self = this;
	var certificationid = req.body.certificationid.trim();
	var certificationname = req.body.certificationname.trim();
	var certificationdesc = req.body.certificationdesc.trim();
	var certificationdate = req.body.certificationdate.trim();
	
	console.log('CertificationController.handleModifyCertification() ...');
	console.log(certificationname+'-->'+certificationdesc+'-->'+certificationdate);
	
	var old_certificationname = req.body.old_certificationname.trim();
	var old_certificationdesc = req.body.old_certificationdesc.trim();
	var old_certificationdate = req.body.old_certificationdate.trim();
	
	console.log(old_certificationname+'-->'+old_certificationdesc+'-->'+old_certificationdate);
	
	var errorJson = [];
	if(certificationname==null || certificationname==''){
		errorJson.push({'id': 'certificationname', 'value': 'Certification Name is required.'});
	}
	
	if(certificationdesc==null || certificationdesc==''){
		errorJson.push({'id': 'certificationdesc', 'value': 'Certification Description is required.'});
	}
	
	if(certificationdate==null || certificationdate==''){
		errorJson.push({'id': 'certificationdate', 'value': 'Certification Date is required.'});
	}
	
	console.log('CertificationController.handleModifyCertification():: errors: '+errorJson);
	if(errorJson.length==0){
		if(certificationname == old_certificationname && certificationdesc == old_certificationdesc && certificationdate == old_certificationdate){
			errorJson.push({'id': 'globalerror', 'value': 'Atleast change one value.'});
		}
	}
	console.log('CertificationController.handleModifyCertification():: errorJson length: '+errorJson.length);
	console.log(errorJson);
	if(errorJson.length > 0){
		var certificationJson = new Array();
		certificationJson.push({'id': 'certificationid', 'value': certificationid});
		certificationJson.push({'id': 'certificationname', 'value': certificationname}); 
		certificationJson.push({'id': 'certificationdesc', 'value': certificationdesc}); 
		certificationJson.push({'id': 'certificationdate', 'value': certificationdate}); 
		console.log(certificationJson);
		
		var  oldCertificationJson = {'certificationid': certificationid, 'certificationname': old_certificationname, 'certificationdesc': old_certificationdesc, 
					'certificationdate': old_certificationdate};
		console.log(oldCertificationJson);
		 
		res.render('certification/modify', {'certificationJson': certificationJson, 'oldCertificationJson' : oldCertificationJson, 'errorJson': errorJson});
	}
	else{
		//Need to update in DB
		var certification = {'certificationid': certificationid, 'certificationname': certificationname, 'certificationdesc': certificationdesc, 
					'certificationdate': certificationdate, 'updatedby': req.session.user_id};
		console.log('CertificationController.handleModifyCertification():: Trying to update certification details in DB..');
		var dao = new CertificationDao(self.mysqlconpool);
			
		dao.updateCertification(certification);
		
		dao.on('error', function(err){
			console.log('CertificationController.handleModifyCertification():: error occurred while updating the certification details ... Error: '+err);
			res.render('error', {'action': 'updating certification details in DB.', 'error': err});
		});
		
		dao.on('success', function(){
			console.log('CertificationController.handleModifyCertification():: received success event ... ');
			res.render('success', {'action': 'Update Certification', 'message': 'Successfully updated certification details in DB...'});
		});
	}
}

CertificationController.prototype.deleteCertification=function(req, res){
	var self = this;
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('CertificationController.deleteCertification():: query: '+query);
	var id = query['certificationid'];
	var action = query['action'];
	
	if(id ==null || id.trim()==''){
		console.log('CertificationController.deleteCertification():: certification id is required ...');
		res.render('error', {'action': 'deleting certification details.', 'error': 'certification id is required'});
	}
	else{
		var dao = new CertificationDao(self.mysqlconpool);
		dao.deleteCertification(id.trim());
		
		dao.on('error', function(err){
			console.log('CertificationController.deleteCertification():: Error occurred while deleting certification id('+id+') details ... error is: '+err);
			res.render('error', {'action': 'deleting certification details in DB.', 'error': err});
		});
		
		dao.on('success', function(certification){
			console.log('CertificationController.deleteCertification()::  successfully deleted certification details ...');
			res.render('success', {'action': 'Delete Certification', 'message': 'Successfully deleted certification details from DB...'});
		});
	}
}