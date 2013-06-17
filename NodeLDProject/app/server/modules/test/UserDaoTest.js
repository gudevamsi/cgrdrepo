var mysqlconpool = require("../util/MySQLDBConnectionPool").getConnectionPool();
var UserDao = require('../dao/UserDao');

var dao = new UserDao(mysqlconpool);

function testInsert(){
	console.log('Before User ..');
	var user = {'userid':'vamgude', 'firstname': 'vamsi', 'lastname' :'gude', 'designation': 8,'managerid':null ,'role':'USER', 'createdby':'ADMIN'};
	console.log(user);
	dao.insertUser(user);
	
	dao.on('error', function(err){
		console.log('Error: '+err);
	});
	
	dao.on("success", function(id){
		console.log('************** SUCCESS: '+id);
		var UserLoginDao = require('../dao/UserLoginDao');
	
		dao = new UserLoginDao(mysqlconpool);
		console.log('Before User ..');
		var userlogin = {'userid':parseInt(id), 'password': 'test', 'createdby':'ADMIN'};
		console.log(userlogin);
		dao.insertUserLogin(userlogin);
		
		dao.on('error', function(err){
			console.log('Error: '+err);
		});
		
		dao.on('success', function(id){
			console.log('************** SUCCESS: '+id);
		});
		
	});
}

function testGetAll(){
	dao.getAllUsers();
	
	dao.on('error', function(err){
		console.log('Error: '+err);
	});
	
	dao.on('success', function(arr){
		console.log('************** SUCCESS: ');
		for(var i=0; i<arr.length; i++){
			console.log(arr[i]);
		}
	});
}
//testGetAll();

function testUpdateUser(){
	var user = {'userid': 'vamgude', 'firstname': 'Vamsi', 'lastname': 'Gude', 'designation': 8, 'manageruserid': 'ADMIN', 'role': 'USER', 'updatedby': 'ADMIN'}
	console.log(user);
	dao.updateUser(user);
	
	dao.on('error', function(err){
		console.log('Error: '+err);
	});
	
	dao.on('success', function(){
		console.log('************** SUCCESS: ');
	});
}
testUpdateUser();

/* var CommonDao = require('../dao/CommonDao');
var dao = new CommonDao();
dao.getMaxId('USER', 'ID');

dao.on("error", function(err){
	console.log('Error: '+err);
});

dao.on("maxid", function(result){
	console.log("maxid: "+result);
}); */