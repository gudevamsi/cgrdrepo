var designation = require('../model/designation');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");

module.exports = DesignationDao;
Util.inherits(DesignationDao, EventEmitter);
function DesignationDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

DesignationDao.prototype.getAll=function(){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("DesignationDao.getAll():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
		}
		else{
			try{
				console.log('DesignationDao.getAll():: Successfully got connection ...'+con);
				console.log('DesignationDao.getAll():: Executing SQL query to get all desinations ...');
				
				var sql = 'SELECT * FROM DESIGNATION';
				
				con.query(sql, [], function(err, result){
					if(err){
						console.error('DesignationDao.getAll():: Error occurred while executing query ... error: '+err);
						self.emit("error", error);
					}
					else{
						console.log('DesignationDao.getAll():: Successfully executed the query ... ');
						var arr = new Array();
						var count=0;
						for(var i=0; i<result.length; i++){
							var res = result[i];
							var desg = new designation.Designation(res);
							arr[count++] = desg;
						}								
						self.emit("data", arr);
						console.log('DesignationDao.getAll():: Emitted desglist ...');
					}
				});
			}finally{
				con.end();
			}
		}
	});
}