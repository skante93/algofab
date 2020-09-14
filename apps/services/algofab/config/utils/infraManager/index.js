

const PortainerAPI = require('./portainer');

exports.portainer = new PortainerAPI({adminPassword: "password", portainerURL: "http://portainer:9000"});