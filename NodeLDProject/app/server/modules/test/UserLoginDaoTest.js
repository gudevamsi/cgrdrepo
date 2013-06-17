var mysqlconpool = require("../util/MySQLDBConnectionPool").getConnectionPool();
var UserLoginDao = require('../dao/UserLoginDao');

var dao = new UserLoginDao(mysqlconpool);
console.log('Before User ..');
var userlogin = {'userid':1, 'password': 'test', 'createdby':'ADMIN'};
console.log(userlogin);
dao.insertUserLogin(userlogin);

dao.on('error', function(err){
	console.log('Error: '+err);
});

dao.on("success", function(id){
	console.log('************** SUCCESS: '+id);
});