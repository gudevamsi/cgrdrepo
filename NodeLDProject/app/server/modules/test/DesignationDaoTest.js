var mysqlconpool = require("../util/MySQLDBConnectionPool").getConnectionPool();
var DesignationDao = require('../dao/DesignationDao');
var dao = new DesignationDao(mysqlconpool);
dao.getAll();

dao.on('error', function(err){
	console.log('DesignationDaoTest:: Error: '+err);
});

dao.on("invaliduser", function(){
	console.log('DesignationDaoTest:: Invalid User ...');
});

dao.on('validuser', function(data){
	console.log('DesignationDaoTest:: data');
	console.log(data);
});

dao.on("data", function(data){
	console.log('DesignationDaoTest:: data: '+data);
});