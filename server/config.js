var config = {}

// Authentication mode, possible values: none, basic

config.auth = "none";

// Username and password for the basic authentication

config.username = "hcuser";
config.password = "hcpass";

// Port number for the service discovery, default: 1900

config.ssd_port = 1900;

// Port number for the control connections, default: 3000

config.http_port = 3000;


module.exports = config;