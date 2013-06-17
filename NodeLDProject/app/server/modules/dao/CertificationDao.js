var user = require('../model/user');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = CertificationDao;
Util.inherits(CertificationDao, EventEmitter);
function CertificationDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

CertificationDao.prototype.insertCertification=function(certificationname, certificationdesc, certificationdate, userprimaryid, createdby){
	var self = this;
	var CommonDao = require('./CommonDao');
	var dao = new CommonDao(self.mysqlconpool);
	dao.getMaxId('CERTIFICATION_DETAILS', 'ID');
	
	dao.on("error", function(err){
		console.log('Error: '+err);
		self.emit("error", err);
	});
	
	dao.on("maxid", function(result){
		var id = parseInt(result);
		console.log("CertificationDao.insertCertification():: Received maxid event ..."+id);
		
		self.mysqlconpool.getConnection(function(err, con){
			if(err){
				console.log("CertificationDao.insertCertification():: Error occurred while getting connection .. Error is: "+err);
				self.emit("error", err);
				con.end();
			}
			else{
				console.log('CertificationDao.insertCertification():: CertificationDao:: Successfully got connection ...'+con);
				var sql = "INSERT INTO CERTIFICATION_DETAILS (ID, NAME, DESCRIPTION, USER_ID, CERTIFICATION_DATE, CREATED_BY, CREATED_DATE, ACTIVE) "+
			  	"VALUES (?, ?, ?, ?, ?, ?, ?, 'Y')";
			  	var date = new Date();
			  	var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			  	console.log('CertificationDao.insertCertification():: Date is: '+fdate);
				con.query(sql, [++id, certificationname, certificationdesc, userprimaryid, certificationdate, createdby, fdate], function(err, result){
					if(err){
						console.log("CertificationDao.insertCertification():: error: "+err);
						console.log("CertificationDao.insertCertification():: Failed to insert certification details in DB ... Error: "+err);
						self.emit("error", err);
						con.end();
					}
					else{
						console.log("CertificationDao.insertCertification():: Successfully inserted certification details in DB ...");
						self.emit("success", id);
						console.log("CertificationDao.insertCertification():: Emitted event success ..");
						con.end();
					}
				});	
			}
		});
	});
}

CertificationDao.prototype.getCertificationById=function(id){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("CertificationDao.getCertificationById():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('CertificationDao.getCertificationById():: Successfully got DB connection ..');
			var sql = "SELECT C.ID, C.NAME, C.CERTIFICATION_DATE, C.DESCRIPTION, U.USER_ID, U.FIRST_NAME, U.LAST_NAME FROM CERTIFICATION_DETAILS C, "+
			" USER U WHERE C.USER_ID=U.ID AND C.ID=? AND C.ACTIVE='Y'";
			con.query(sql, [id], function(err, result){
				if(err){
					console.log('CertificationDao.getCertificationById():: error occurred while retrieving certification details for id: '+id+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('CertificationDao.getCertificationById():: successfully retrieved certification details ...');
					if(result.length == 0){
						console.log('CertificationDao.getCertificationById():: certification details not exist for id: '+id+'... error is: '+err);
						self.emit("notexist", err);
						con.end();
						console.log('CertificationDao.getCertificationById():: successfully emitted notexist event ..');
					}
					else{
						var cert = result[0];
						var cdate = cert.CERTIFICATION_DATE;
			  			var sdate = dateFormat(cdate, "yyyy-mm-dd");
			  			
						var ncert = {'certificationid': cert.ID, 'certificationname': cert.NAME, 'certificationdate': sdate, 
							'certificationdesc': cert.DESCRIPTION, 'userid': cert.USER_ID, 'firstname': cert.FIRST_NAME, 'lastname': cert.LAST_NAME};
						self.emit("exist", ncert);
						con.end();
						console.log('CertificationDao.getCertificationById():: Successfully emitted exist event ..');
						console.log(ncert);
					}
				}
			});
		}
	});
}

CertificationDao.prototype.getAllCertificationForUser=function(userid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("CertificationDao.getAllCertificationForUser():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('CertificationDao.getAllCertificationForUser():: Successfully got DB connection ..');
			var sql = "SELECT C.ID, C.NAME, C.CERTIFICATION_DATE, C.DESCRIPTION, U.USER_ID, U.FIRST_NAME, U.LAST_NAME FROM CERTIFICATION_DETAILS C, "+
			" USER U WHERE C.USER_ID=U.ID AND C.USER_ID=? AND C.ACTIVE='Y'";
			con.query(sql, [userid], function(err, result){
				if(err){
					console.log('CertificationDao.getAllCertificationForUser():: error occurred while retrieving all certification details for user id: '+userid+'... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('CertificationDao.getAllCertificationForUser():: successfully retrieved certification details ...');
					var certarr = new Array();
					for(var i=0; i<result.length; i++){
						var cert = result[i];
						var cdate = cert.CERTIFICATION_DATE;
			  			var sdate = dateFormat(cdate, "yyyy-mm-dd");
			  			
						var ncert = {'certificationid': cert.ID, 'certificationname': cert.NAME, 'certificationdate': sdate, 
							'certificationdesc': cert.DESCRIPTION, 'userid': cert.USER_ID, 'firstname': cert.FIRST_NAME, 'lastname': cert.LAST_NAME};
						certarr[i] = ncert;
					}
					self.emit("success", certarr);
					con.end();
					console.log('CertificationDao.getAllCertificationForUser():: Successfully emitted exist event ..');
				}
			});
		}
	});
}

CertificationDao.prototype.updateCertification=function(certification){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("CertificationDao.updateCertification():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('CertificationDao.updateCertification():: Successfully got DB connection ..');
			console.log(certification);
			var sql = "UPDATE CERTIFICATION_DETAILS SET NAME=?, CERTIFICATION_DATE=?, DESCRIPTION=?, UPDATED_BY=?, UPDATED_DATE=? WHERE ID=?";
			var date = new Date();
			var fdate = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
			con.query(sql, [certification.certificationname, certification.certificationdate, certification.certificationdesc, 
					certification.updatedby, fdate, certification.certificationid], function(err, result){
				if(err){
					console.log('CertificationDao.updateCertification():: error occurred while updating certification details... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('CertificationDao.updateCertification():: successfully updated certification details ...');
					self.emit("success");
					con.end();
					console.log('CertificationDao.updateCertification():: Successfully emitted exist event ..');
				}
			});
		}
	});
}

CertificationDao.prototype.deleteCertification=function(certificationid){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("CertificationDao.deleteCertification():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
			con.end();
		}
		else{
			console.log('CertificationDao.deleteCertification():: Successfully got DB connection ..');
			var sql = "UPDATE CERTIFICATION_DETAILS SET ACTIVE='N' WHERE ID=?";
			con.query(sql, [certificationid], function(err, result){
				if(err){
					console.log('CertificationDao.deleteCertification():: error occurred while deleting certification details... error is: '+err);
					self.emit("error", err);
					con.end();
				}
				else{
					console.log('CertificationDao.deleteCertification():: successfully deleted certification details ...');
					self.emit("success");
					con.end();
					console.log('CertificationDao.deleteCertification():: Successfully emitted exist event ..');
				}
			});
		}
	});
}