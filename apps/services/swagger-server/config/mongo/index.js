

const { mongoose, UsersManager, ResourcesManager, LicencesManager,  AgreementManager, RatingsManager} = require('./models');

exports.UsersManager = UsersManager;
exports.ResourcesManager = ResourcesManager;
exports.LicencesManager = LicencesManager;
exports.AgreementManager = AgreementManager;
exports.RatingsManager = RatingsManager;

exports.mongo = mongoose;