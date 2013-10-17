var _ = require("lodash");

var defaultVersions = []

module.exports = {
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "0.9"
  },{
    "type": "input",
    "name": "dbname",
    "message": "DB name?",
    "validate": this.helpers.inquirer.required()
  },{
    "type": "input",
    "name": "host",
    "message": "Host?",
    "default": "localhost"
  },{
    "type": "input",
    "name": "port",
    "message": "Port?",
    "default": "27017",
    "filter": this.helpers.inquirer.toInt()
  },{
    "type": "input",
    "name": "username",
    "message": "[optional] Username?",
    "filter": this.helpers.inquirer.toUndefined()
  },{
    "type": "password",
    "name": "password",
    "message": "[optional] Password?",
    "filter": this.helpers.inquirer.toUndefined(),
    "when": function (answers) {
      return !!answers.username;
    }
  }],
  "app": {
    "conf": {
      "application": [
        'mongodb.uri="mongodb://<%= instance.prompts.username %><% if(instance.prompts.username && instance.prompts.password) { %>:<%= instance.prompts.password %><% } %><% if(instance.prompts.username) { %>@<% } %><%= instance.prompts.host %>:<%= instance.prompts.port %>/<%= instance.prompts.dbname %>"'
        ],
      "plugins": []
    },
    "project": {
      "build": {
        "dependencies": ['"org.reactivemongo" %% "reactivemongo" % "0.9"', '"org.reactivemongo" %% "play2-reactivemongo" % "0.9"'],
        "settings": []
      },
      "plugins": []
    }
  }
}
