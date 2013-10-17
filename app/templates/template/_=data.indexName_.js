module.exports = {
  // Be nice and say hello
  welcome: [{
    'status': 'write'
  },{
    'status': 'writeln',
    'message': 'Hello and welcome to <%= prompts.name %>!'
  },{
    'status': 'write'
  }],
  prePrompts: function () {
    // Here you can do some stuff right after your template has been loaded.
  },
  // Ask all questions your want.
  // Based on Inquirer.js ( https://github.com/SBoudrias/Inquirer.js )
  prompts: [{
    'type': 'input',
    'name': 'name',
    'message': 'What\'s your name?'
  }],
  postPrompts: function () {
    // Here you can do some stuff after that all questions have been answers.
  },
  postWriteFiles: function () {
    // Want to do awesome thing after all files of your template have been copied? Do it here!
  },
  postWriteConfFiles: function () {
    // Finally, this is your last hook, happening right after conf files (like .json or .propertiers or whatever) have been updated.
  },
  // You can say goodbye to your users
  bye: [{
    'status': 'write'
  },{
    'status': 'ok',
    'message': 'Thanks you for using me!'
  },{
    'status': 'write'
  }],
  // You can conditionally exlude any file depending on the answer of your users
  // Based on minimatch ( https://github.com/isaacs/minimatch )
  files: {
    'index.js': {
      'excluded': true
    }
  }
}
