module.exports = {
  'prompts': [{
    'type': 'input',
    'name': 'version',
    'message': 'What is your new version?',
    'validate': this.helpers.inquirer.required()
  }],
  'constants': {
    'application': {
      'version': '<%= instance.prompts.version %>'
    }
  },
  'package': {
    'version': '<%= instance.prompts.version %>'
  }
}
