var helpers = require('../../utils/helpers.js');

module.exports = {
  prompts: [{
    'type': 'input',
    'name': 'version',
    'message': 'What is your new version?',
    'validate': helpers.inquirer.required()
  }],
  configuration: [{
    type: 'json',
    path: 'package.json',
    content: {
      version: '<%= prompts.version %>'
    }
  }],
  bye: function () {
    this._emptyLine();
    this._success('See ya!');
    this._emptyLine();
  }
};
