var path = require('path');
var helpers = require('../../../utils/helpers.js');

module.exports = {
  'welcome': [{
    'status': 'write'
  },{
    'status': 'writeln',
    'message': 'Hi there. Let\'s template a template together!'
  },{
    'status': 'write'
  }],
  'prompts': [{
    'type': 'input',
    'name': 'name',
    'message': 'What\'s the name of your template?',
    'default': path.basename(process.cwd()),
    'validate': helpers.inquirer.required()
  }],
  'bye': [{
    'status': 'write'
  },{
    'status': 'ok',
    'message': 'Thanks you for using me!'
  },{
    'status': 'write'
  }],
  postPrompts: function () {
    this.instance.data = {
      indexName: 'index'
    }
  },
  'files': {
    'index.js': {
      'excluded': true
    }
  }
}
