var path = require('path');
var helpers = require('../../../utils/helpers.js');

module.exports = {
  welcome: function () {
    this._emptyLine();
    this._high('Looks like it\'s time to start a new awesome module!');
    this._emptyLine();
  },
  prompts: [{
    'type': 'input',
    'name': 'name',
    'message': 'What\'s the name of your module?',
    'default': path.basename(process.cwd()),
    'validate': helpers.inquirer.required()
  }],
  bye: function () {
    this._emptyLine();
    this._success('Hope you will rule the world with it!');
    this._emptyLine();
  },
  postPrompts: function () {
    this.data = {
      packageName: 'package'
    };
  },
  files: {
    'index.js': {
      'excluded': true
    }
  }
};
