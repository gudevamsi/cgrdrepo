
var Designation = module.exports.Designation = function(u){
	var u = u || 0;
	this.designationId = u.DESIGNATION_ID || '';
	this.name = u.NAME || '';
	this.description = u.DESCRIPTION || '';
	return this;
}
