
var User = module.exports.User = function(u){
	var u = u || 0;
	this.id = u.ID || '';
	this.userid = u.USER_ID || '';
	this.firstname = u.FIRST_NAME || '';
	this.lastname  = u.LAST_NAME || '';
	this.designation = u.DESIGNATION || '';
	this.managerid= u.MANAGER || null;
	this.manageruserid= u.MANAGERID || null;
	this.role = u.ROLE || '';
	this.createdby = u.CREATED_BY || '';
	this.updatedby = u.UPDATED_BY || '';
	return this;
}
