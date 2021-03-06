var path = require('path');
var helpers = require('../../../utils/helpers.js');

module.exports = {
  welcome: function () {
    this._emptyLine();
    this._high('Hi there. Let\'s template a template together!');
    this._emptyLine();
  },
  prompts: [{
    'type': 'input',
    'name': 'name',
    'message': 'What\'s the name of your template?',
    'default': path.basename(process.cwd()),
    'validate': helpers.inquirer.required()
  }],
  bye: function () {
    this._emptyLine();
    this._success('Thanks for using me!');
    this._emptyLine();
  },
  postPrompts: function () {
    this.data = {
      indexName: 'index'
    };
  },
  files: {
    'index.js': {
      'excluded': true
    }
  }
};
