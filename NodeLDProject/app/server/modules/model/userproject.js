var dateFormat = require("dateformat");
var UserProject = module.exports.UserProject = function(u){
	var u = u || 0;
	this.id = u.ID || '';
	this.userid = u.USER_ID || '';
	this.username = u.USERNAME || '';
	this.firstname = u.FIRSTNAME || '';
	this.lastname  = u.LASTNAME || '';
	this.role = u.ROLE_ID || '';
	this.roleName = u.ROLE_NAME || '';
	this.projectid = u.PROJECT_ID || '';
	this.projectname= u.PROJECT_NAME || '';
	this.createdby_id= u.CREATED_BY_ID || '';
	this.createdby_userid= u.CREATED_BY_USERNAME || '';
	this.createdby_firstName= u.CREATED_BY_FN || '';
	this.createdby_lastName = u.CREATED_BY_LN|| '';
	this.updatedby_id= u.UPDATED_BY_ID || '';
	this.updatedby_userid= u.UPDATED_BY_UN || '';
	this.updatedby_firstName= u.UB_FN || '';
	this.updatedby_lastName = u.UB_LN || '';
	this.start_date = dateFormat(u.START_DATE, "yyyy-mm-dd") || '';
	this.end_date = dateFormat(u.END_DATE, "yyyy-mm-dd") || '';
	this.created_date = u.CREATED_DATE || '';
	this.updated_date = u.UPDATED_DATE || '';
	return this;
}