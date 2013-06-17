var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var dateFormat = require("dateformat");

module.exports = CommonDao;
Util.inherits(CommonDao, EventEmitter);
function CommonDao(mysqlconpool){
	EventEmitter.call(this);
	this.mysqlconpool = mysqlconpool;
}

CommonDao.prototype.getMaxId=function(tablename, colname){
	var self = this;
	self.mysqlconpool.getConnection(function(err, con){
		if(err){
			console.log("CommonDao.getMaxId():: Error occurred while getting connection .. Error is: "+err);
			self.emit("error", err);
		}
		else{
			console.log('CommonDao.getMaxId():: Successfully got connection ...'+con);
			console.log('CommonDao.getMaxId():: Trying to get max id for table: '+tablename);
			var sql = "SELECT MAX("+colname+") AS ID FROM "+tablename;
			con.query(sql, [], function(err, result){
				if(err){
					console.log("CommonDao.getMaxId():: Error occurred while finding max id .. error is: "+err);
					con.end();
					self.emit("error", err);
				}
				else{
					var rslt = result[0];
					console.log(rslt);
					console.log('CommonDao.getMaxId():: Max Id is: '+rslt.ID);
					var id;
					if(rslt.ID==null){
						id="0";
					}
					else{
						id = rslt.ID;
					}
					con.end();
					self.emit("maxid", id);
					console.log("CommonDao.getMaxId():: Successfully emitted maxid event ...");
				}
			});
		}
	});
}