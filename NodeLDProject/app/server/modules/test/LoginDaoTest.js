var mysqlconpool = require("../util/MySQLDBConnectionPool").getConnectionPool();
var LoginDao = require('../dao/LoginDao');
var dao = new LoginDao(mysqlconpool);
dao.getUserById('ADMIN');

dao.on('error', function(err){
	console.log('LoginDaoTest:: Error: '+err);
});

dao.on("notexist", function(){
	console.log('LoginDaoTest:: Invalid User ...');
});

dao.on('exist', function(data){
	console.log('LoginDaoTest:: data: ');
	console.log(data);
});