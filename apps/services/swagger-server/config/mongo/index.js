

const { mongoose, UsersManager, ResourcesManager, LicencesManager,  AgreementManager} = require('./models');

exports.UsersManager = UsersManager;
exports.ResourcesManager = ResourcesManager;
exports.LicencesManager = LicencesManager;
exports.AgreementManager = AgreementManager;

exports.mongo = mongoose;