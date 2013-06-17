/*
var dateFormat = require('dateformat');

var date = new Date();
console.log(date);

console.log(dateFormat(date, "yyyy-mm-dd HH-MM-ss"));
*/

var mysql = require('mysql');
var pool = mysql.createPool({
	user 		: 'root',
	password 	: 'root',
	host 		: 'localhost',
	database 	: 'lddb',
	port 		: 3306
});

pool.getConnection(function(err, con) {
	if(err){
		console.log('Error: '+err);
	}
	else{
		console.log('Connection is: '+con);
		var sql = "SELECT MAX(ID) FROM USER";
		con.query(sql, [], function(err, result){
			if(err){
				console.log("Error occurred while finding max id .. error is: "+err);
			}
			else{
				var rslt = result[0];
				console.log(rslt);
				console.log('Max Id is: '+rslt.ID);
				
				sql = "SELECT * FROM USER";
				con.query(sql, [], function(err, result){
					if(err){
						console.log('Error: '+err);
					}
					else{
						for(var i=0; i<result.length; i++){
							console.log(result[i]);
						}
						con.end();
					}
				});
			}
		});	
	}	
});

