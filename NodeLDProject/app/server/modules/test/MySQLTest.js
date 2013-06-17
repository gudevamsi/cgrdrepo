var mysqlconpool = require("../util/MySQLDBConnectionPool").getConnectionPool();

mysqlconpool.getConnection(function(err, con){
	if(err){
		console.log('MySQLTest:: Error: '+err);
	}
	else{
		con.query('select * from USER', function(err, results){
			if(err){
				console.log('MySQLTest:: Error: '+err);
				con.end();
			}
			else{
				//console.log(results);
				for(var i=0; i<results.length;i++){
					var res = results[i];
					console.log(res);
				}
				con.end();
			}
		});
	}
});
