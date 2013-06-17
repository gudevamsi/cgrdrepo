var mysqlconpool = require("../util/MySQLDBConnectionPool").getConnectionPool();
var ProjectDao = require('../dao/ProjectDao');

var dao = new ProjectDao(mysqlconpool);

function testGetAll(){
	dao.getAllProjects();
	
	dao.on('error', function(err){
		console.log('Error: '+err);
	});
	
	dao.on("success", function(arr){
		console.log('************** SUCCESS: ');
		console.log(arr);
	});
}

testGetAll();