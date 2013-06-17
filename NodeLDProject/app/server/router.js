var http = require('http');
var url = require('url');
var constants = require('./modules/util/constants');
var LoginController = require('./modules/controller/LoginController');
var UserController = require('./modules/controller/UserController');
var ProjectController = require('./modules/controller/ProjectController');
var ProjectRoleController = require('./modules/controller/ProjectRoleController');
var TrainingController = require('./modules/controller/TrainingController');
var DashboardController = require('./modules/controller/DashboardController');
var TaggingController = require('./modules/controller/TaggingController');
var CertificationController = require('./modules/controller/CertificationController');
var mysqlconpool = require("./modules/util/MySQLDBConnectionPool").getConnectionPool();

function checkAuth(req, res, next) {
  console.log('router.checkAuth:: Userid in session: '+req.session.user_id);
  if (!req.session.user_id) {
  	console.log('router.checkAuth:: Session: userid not exist ...');
    res.render('handleAjaxRequest', { 'from': 'router'});
  } else {
  	console.log('router.checkAuth:: Session user is exist ...');
    next();
  }
}

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
};

module.exports = function(app) {	
	app.get('/', checkAuth, function(req, res){
		//Already logged in
		console.log('router.get./ :: received request for / ...');
		var userid = req.session.user_id;
		console.log('router.get./ :: User id from session is: '+userid);
		var LoginDao = require('./modules/dao/LoginDao');
		var logindao = new LoginDao(mysqlconpool);
		logindao.getUserById(null, userid);
		logindao.on("error", function(err){
			console.log('router.get./ :: Error: '+err);
			res.render('index', { title: constants.title, dojourl : constants.dojourl, 'error': 'Error: '+err });
		});
		
		logindao.on("notexist", function(){
			console.log('router.get./ :: Invalid User ...');
			res.render('index', { title: constants.title, dojourl : constants.dojourl, 'error': constants.login_username_password_invalid });
		});
		
		logindao.on("exist", function(data){
			console.log('router.get./ :: User('+username+') is valid user ...');
			res.render('home', { 'title': constants.title, 'dojourl' : constants.dojourl, 'data': data});
		});	
		//res.render('home', { title: constants.title, dojourl : constants.dojourl });
	});
	
	app.get('/login', function(req, res){
		console.log('router.get.login:: received request for login ...');
		res.render('index', { 'title': constants.title, 'dojourl' : constants.dojourl });
	});
	
	app.post('/login', function(req, res){
		console.log('router.post.login:: Received request ...');
		var loginController = new LoginController(mysqlconpool);
		loginController.handleLogin(req, res);
	});
	
	app.get('/logout', checkAuth, function(req, res){
		console.log('router.get.logout:: Logging out from application');
		delete req.session.user_id;
		delete req.session.user_role;
		delete req.session.user_primary_id;
		res.render('index', { title: constants.title, dojourl : constants.dojourl, 'error': constants.logout_success });
	});
	
	app.get('/adduser', checkAuth, function(req, res){
		console.log('router.get.adduser:: GET request received for adding user ... rendering add page ...');
		var userController = new UserController(mysqlconpool);
		userController.displayAddUser(req, res);
	});
	
	app.post('/adduser', checkAuth, function(req, res){
		console.log('router.post.adduser:: POST request received for adding user ... ');
		var userController = new UserController(mysqlconpool);
		userController.handleAddUser(req, res);
	});
	
	app.get('/viewalluser', checkAuth, function(req, res){
		console.log('router.get.viewalluser:: Received request for view all user ...');
		var userController = new UserController(mysqlconpool);
		userController.displayViewAllUsers(req, res);
	});	
	
	app.get('/viewuser', checkAuth, function(req, res){
		console.log('router.get.viewuser:: Received request for view user ...');
		var userController = new UserController(mysqlconpool);
		userController.displayViewUser(req, res);
	});
	
	app.get("/modifyuser", checkAuth, function(req, res){
		console.log('router.get.modifyuser:: Received request for modify user ...');
		var userController = new UserController(mysqlconpool);
		userController.displayModifyUser(req, res);
	});
	
	app.post("/modifyuser", checkAuth, function(req, res){
		console.log('router.post.modifyuser:: received modifyuser post request ...');
		var userController = new UserController(mysqlconpool);
		userController.handleModifyUser(req, res);
	});
	
	app.get('/deleteuser', checkAuth, function(req, res){
		console.log('router.get.deleteuser:: Received request for delete user ...');
		var userController = new UserController(mysqlconpool);
		userController.handleDeleteUser(req, res);
	});
	
	app.post('/validateuserid', checkAuth, function(req, res){
		console.log('router.post.validateuserid:: Received request for validate user id ...');
		var loginController = new LoginController(mysqlconpool);
		loginController.validateUserId(req, res);
	});
	
	app.post('/validatemanageruserid', checkAuth, function(req, res){
		console.log('router.post.validateManagerUserId:: Received request for validate user id ...');
		var loginController = new LoginController(mysqlconpool);
		loginController.validateManagerUserId(req, res);
	});
	
	app.get('/addproject', checkAuth, function(req,res){
		console.log('router.get.addproject:: Received request for add project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayAddProject(req, res);
	});
	
	app.post('/addproject', checkAuth, function(req,res){
		console.log('router.post.addproject:: Received request for add project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.handleAddProject(req, res);
	});
	
	app.get('/viewproject', checkAuth, function(req, res){
		console.log('router.get.viewproject:: Received request for view project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayViewProject(req, res);
	});
	
	app.get('/viewallprojects', checkAuth, function(req, res){
		console.log('router.get.viewallprojects:: Received request for view all project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayViewAllProjects(req, res);
	});
	
	app.get('/modifyproject', checkAuth, function(req, res){
		console.log('router.get.modifyproject:: Received request for modify project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayModifyProject(req, res);
	});
	
	app.post('/modifyproject', checkAuth, function(req, res){
		console.log('router.post.modifyproject:: Received request for modify project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.handleModifyProject(req, res);
	});
	
	app.get('/deleteproject', checkAuth, function(req, res){
		console.log('router.get.deleteproject:: Received request for delete project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.handleDeleteProject(req, res);
	});	

	app.get('/addtraining', checkAuth, function(req,res){
		console.log('router.get.addtraining:: Received request for add training ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.displayAddTraining(req, res);
	});
	
	app.post('/addtraining', checkAuth, function(req,res){
		console.log('router.post.addtraining:: Received request for add training ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.handleAddTraining(req, res);
	});
	
	app.get('/viewtraining', checkAuth, function(req, res){
		console.log('router.get.viewtraining:: Received request for view traininf ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.displayViewTraining(req, res);
	});
	
	app.get('/viewtrainingformanager', checkAuth, function(req, res){
		console.log('router.get.viewtraining:: Received request for view traininf ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.displayViewTrainingForManager(req, res);
	});
	
	app.get('/viewalltrainings', checkAuth, function(req, res){
		console.log('router.get.viewalltrainings:: Received request for view all trainings ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.displayViewAllTrainings(req, res);
	});
	
	app.get('/modifytraining', checkAuth, function(req, res){
		console.log('router.get.modifytraining:: Received request for modify training ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.displayModifyTraining(req, res);
	});	
	
	app.post('/modifytraining', checkAuth, function(req, res){
		console.log('router.post.modifytraining:: Received request for modify training ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.handleModifyTraining(req, res);
	});

	app.get('/deletetraining', checkAuth, function(req, res){
		console.log('router.get.deletetraining:: Received request for delete training ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.handleDeleteTraining(req, res);
	});	
		
	app.get('/addprojectrole', checkAuth, function(req,res){
		console.log('router.get.addprojectrole:: Received request for add project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.displayAddProjectRole(req, res);
	});
	
	app.post('/addprojectrole', checkAuth, function(req,res){
		console.log('router.post.addprojectrole:: Received request for add project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.handleAddProjectRole(req, res);
	});
	
	app.get('/viewprojectrole', checkAuth, function(req, res){
		console.log('router.get.viewprojectrole:: Received request for view project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.displayViewProjectRole(req, res);
	});
	
	app.get('/viewallprojectroles', checkAuth, function(req, res){
		console.log('router.get.viewallprojectroles:: Received request for view all project roles ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.displayViewAllProjectRoles(req, res);
	});
	
	app.post('/validateprojectrolename', checkAuth, function(req, res){
		console.log('router.get.validateprojectrolename:: Received request for view project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.validateProjectRoleName(req, res);
	});
	
	app.get('/modifyprojectrole', checkAuth, function(req, res){
		console.log('router.get.modifyprojectrole:: Received request for modify project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.displayModifyProjectRole(req, res);
	});	
	
	app.post('/modifyprojectrole', checkAuth, function(req, res){
		console.log('router.post.modifyprojectrole:: Received request for modify project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.handleModifyProjectRole(req, res);
	});

	app.get('/deleteprojectrole', checkAuth, function(req, res){
		console.log('router.get.deleteprojectrole:: Received request for delete project role ...');
		var projectRoleController = new ProjectRoleController(mysqlconpool);
		projectRoleController.handleDeleteProjectRole(req, res);
	});	
	
	app.get('/showuserdashboard', checkAuth, function(req, res){
		console.log('router.get.showuserdashboard:: Received request for show user dashboard ...');
		var dashboardController = new DashboardController(mysqlconpool);
		dashboardController.showUserDashboard(req, res);
	});	
	
	app.get('/subscribetraining', checkAuth, function(req, res){
		console.log('router.get.subscribetraining:: Received request for subscribing to training ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.subscribeForTraining(req, res);
	});	
	
	app.get('/showmanagerdashboard', checkAuth, function(req, res){
		console.log('router.get.showmanagerdashboard:: Received request for show manager dashboard ...');
		var dashboardController = new DashboardController(mysqlconpool);
		dashboardController.showManagerDashboard(req, res);
	});	
	
	app.get('/viewtrainingnomination', checkAuth, function(req, res){
		console.log('router.get.viewtrainingnomination:: Received request for view training nomination ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.showTrainingNomination(req, res);
	});
	
	app.get('/approverejecttrainingnomination', checkAuth, function(req, res){
		console.log('router.get.approverejecttrainingnomination:: Received request for approve or reject training nomination ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.approveOrRejectTrainingNomination(req, res);
	});
	
	app.get('/updateTrainingAttendance', checkAuth, function(req, res){
		console.log('router.get.updateTrainingAttendance:: Received request for update training attendance ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.updateTrainingAttendance(req, res);
	});
	
	app.get('/viewappreciation', checkAuth, function(req, res){
		console.log('router.get.viewappreciation:: Received request for  view appreciation project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayViewAppreciation(req, res);
	});
	
	app.get('/addTagging', checkAuth, function(req,res){
		console.log('router.get.addprojectrole:: Received request for add tagging ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.displayAddTagging(req, res);
	
	});
	app.post('/addTagging', checkAuth, function(req,res){
		console.log('router.get.addprojectrole:: Received request for add tagging ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.handleAddTagging(req, res,0);
	
	});
	
	app.post('/validateuserTagging', checkAuth, function(req, res){
		console.log('router.post.validateuserTagging:: Received request for validate user Tagging ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.validateuserTagging(req, res);
		
	});
	app.get('/viewallTagging', checkAuth, function(req, res){
		console.log('router.get.viewalluser:: Received request for view all user tagging...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.displayViewAllTagging(req, res);
	});	

	app.get('/viewuserproject', checkAuth, function(req, res){
		console.log('router.get.viewuserproject:: Received request for view user project ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.displayViewTagging(req, res);
	});
		
	app.get('/deleteuserproject', checkAuth, function(req, res){
		console.log('router.get.deleteuserproject:: Received request for delete user project ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.handleDeleteUserProject(req, res);
	});	
	
	app.get('/modifyuserproject', checkAuth, function(req, res){
		console.log('router.get.modifyuserproject:: Received request for modify user project ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.displayModifyUserProject(req, res);
	});
	
	app.post('/modifyuserproject', checkAuth, function(req, res){
		console.log('router.post.modifyuserproject:: Received request for modify project ...');
		var taggingController = new TaggingController(mysqlconpool);
		taggingController.handleModifyUserProject(req, res);
	});
	
	
	app.get('/addappreciation', checkAuth, function(req, res){
		console.log('router.post.addappreciation:: Received request for add appreciation ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.diplayAddAppreciation(req, res);
	});
	
	app.post('/addappreciation', checkAuth, function(req, res){
		console.log('router.post.addappreciation:: Received request for add appreciation ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.handleAddAppreciation(req, res);
	});
	
	app.post('/getUsersByProjectId', checkAuth, function(req, res){
		console.log('router.post.getUsersByProjectId:: Received request for getUsersByProjectId ...');
		var userController = new UserController(mysqlconpool);
		userController.getUsersByProjectId(req, res);
	});
	
	app.get('/viewallappreciations', checkAuth, function(req, res){
		console.log('router.get.viewallappreciations:: Received request for view all appreciations ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayViewAllAppreciations(req, res);
	});
	
	app.get('/modifyappreciation', checkAuth, function(req, res){
		console.log('router.get.modifyappreciation:: Received request for modify APPRECIATION ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayModifyAppreciation(req, res);
	});
	
	app.post("/modifyappreciation", checkAuth, function(req, res){
		console.log('router.post.modifyappreciation:: received modifyappreciation post request ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.handleModifyAppreciation(req, res);
	});
	
	app.get('/viewappreciation', checkAuth, function(req, res){
		console.log('router.get.viewappreciation:: Received request for  view appreciation project ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.displayViewAppreciation(req, res);
	});
	
	app.get('/deleteappreciation', checkAuth, function(req, res){
		console.log('router.get.deleteappreciation:: Received request for delete appreciation ...');
		var projectController = new ProjectController(mysqlconpool);
		projectController.handleDeleteAppreciation(req, res);
	});
	
	app.get('/viewreportedusers', checkAuth, function(req, res){
		console.log('router.get.viewreportedusers:: Received request for view reported users ...');
		var userController = new UserController(mysqlconpool);
		userController.getReportedUsers(req, res);
	});
	
	app.get('/viewusersummary', checkAuth, function(req, res){
		console.log('router.get.viewusersummary:: Received request for view user summary ...');
		var userController = new UserController(mysqlconpool);
		userController.viewUserSummary(req, res);
	});
	
	app.get('/addcertification', checkAuth, function(req, res){
		console.log('router.get.addcertification:: Received request for add certification ...');
		res.render('certification/add');
	});
	
	app.post('/addcertification', checkAuth, function(req, res){
		console.log('router.get.addcertification:: Received request for add certification ...');
		var certificationController = new CertificationController(mysqlconpool);
		certificationController.addCertification(req, res);
	});
	
	app.get('/viewcertification', checkAuth, function(req, res){
		console.log('router.get.viewcertification:: Received request for view certification ...');
		var certificationController = new CertificationController(mysqlconpool);
		certificationController.displayViewCertification(req, res);
	});
	
	app.get('/viewallcertification', checkAuth, function(req, res){
		console.log('router.get.viewallcertification:: Received request for view all certification ...');
		var certificationController = new CertificationController(mysqlconpool);
		certificationController.displayViewAllCertification(req, res);
	});
	
	app.get('/modifycertification', checkAuth, function(req, res){
		console.log('router.get.modifycertification:: Received request for modify certification ...');
		var certificationController = new CertificationController(mysqlconpool);
		certificationController.viewModifyCertification(req, res);
	});
	
	app.post('/modifycertification', checkAuth, function(req, res){
		console.log('router.post.modifycertification:: Received request for modify certification ...');
		var certificationController = new CertificationController(mysqlconpool);
		certificationController.handleModifyCertification(req, res);
	});
	
	app.get('/deletecertification', checkAuth, function(req, res){
		console.log('router.get.deletecertification:: Received request for delete certification ...');
		var certificationController = new CertificationController(mysqlconpool);
		certificationController.deleteCertification(req, res);
	});
	
	app.get('/viewallfuturetrainings', checkAuth, function(req, res){
		console.log('router.get.viewtraining:: Received request for view traininf ...');
		var trainingController = new TrainingController(mysqlconpool);
		trainingController.displayallfuturetrainings(req, res);
	});
	app.get('*', function(req, res) {		
		res.render('404', { title: 'Page Not Found'}); 
	});
	
	app.post('*', function(req, res) {		
		res.render('404', { title: 'Page Not Found'}); 
	});
};