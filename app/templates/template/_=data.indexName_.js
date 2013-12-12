module.exports = {
  // Be nice and say hello
  welcome: function () {
    this._emptyLine();
    this._high('Hello and welcome to <%= prompts.name %>!');
    this._emptyLine();
  },
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
  postUpdateConfFiles: function () {
    // Finally, this is your last hook, happening right after conf files (like .json or .propertiers or whatever) have been updated.
  },
  // You can say goodbye to your users
  bye: function () {
    this._emptyLine();
    this._high('Thanks for using me!');
    this._emptyLine();
  },
  // You can conditionally exlude any file depending on the answer of your users
  // Based on minimatch ( https://github.com/isaacs/minimatch )
  files: {
    'index.js': {
      'excluded': true
    }
  }
};
