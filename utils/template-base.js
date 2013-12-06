'use strict';
var util = require('util');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var q = require('q');
var chalk = require('chalk');
var request = require('request');
var yeoman = require('yeoman-generator');
var minimatch = require('minimatch');
var helpers = require('../utils/helpers.js');

var TemplateBase = module.exports =  function TemplateBase(args, options) {
  this.logLevel = options['log-level'] || (options.verbose && 'debug') || 'info';

  yeoman.generators.Base.apply(this, arguments);

  this.constants = {
    PATH_ROOT: process.cwd(),
    CONFIG_FILE: 'generator-template.json',
    DEFAULT_CONFIG: {},
    DEFAULT_PATHS: [this.sourceRoot(), 'https://github.com/generator-template']
  };

  this.paths = {
    'root': this.constants.PATH_ROOT
  };

  this.pkg = this.readFileAsJson(path.join(this.paths.root, '/package.json'), {});
  
  // Read config from the JSON file of the generator inside the current project
  // Useful for communication between templates
  this.config = this.readConfig();

  // Generic display of errors
  this.on('error', function (msg) {
    this.log.error(chalk.red('Error: ') + msg);
  });

  // Never forget to save the config on disk
  this.on("end", function () {
    this.writeConfig();
  });

  // Let's extend Lo-Dash with awesome functions on String
  _.str = require('underscore.string');
  _.mixin(_.str.exports());

  // Assign some utils to this so we can use them everywhere
  this._ = _;
  this.chalk = chalk;
  this.minimatch = minimatch;
  this.helpers = helpers;
};

// ###############################################################################################
// ###############################################################################################
//
// GENERIC METHODS
//
// ###############################################################################################
// ###############################################################################################


/**
  * Test if a value is not null and not undefined
  * @param {*} value - The value to test.
  * @returns {boolean}
  */
yeoman.generators.Base.prototype.isDefined = function (value) {
  return !this._.isNull(value) && !this._.isUndefined(value);
};

// @deprecated: use isDefined
yeoman.generators.Base.prototype.exists = function (value) {
	return !this._.isNull(value) && !this._.isUndefined(value);
};

/**
  * Test if a file exists at a given path
  * @param {string} path - The path to test.
  * @returns {boolean}
  */
yeoman.generators.Base.prototype.existsFile = function (path) {
	return fs.existsSync(path);
};

/**
  * Read a file and try to convert its content to a JavaScript object
  * according to JSON format.
  * @param {string} path - The path of the file to read.
  * @param {object} defaultValue - The value to return if the file doesn't exists or
  * if it fails to read the content as JSON.
  * @returns {*}
  */
yeoman.generators.Base.prototype.readFileAsJson = function(path, defaultValue) {
	return this.existsFile(path) && JSON.parse(this.readFileAsString(path)) || defaultValue;
};

/**
  * Write a file from a JavaScript object. The output will be the JSON generated from the object.
  * @param {string} path - Where to write the file. If there is already a file at this path, it will be
  * overriden if possible.
  * @param {object} value - Will be converted to JSON and written in the file
  * @param {string} [space="  "] - The string to use for pretty format
  * @returns {*}
  */
yeoman.generators.Base.prototype.writeFileFromJson = function(path, value, space) {
  space = space || "  ";
  return this.writeFileFromString(JSON.stringify(value, null, space), path);
};

/**
  * Append a string as a new line to an existing content (which is sooooo awesome)
  * @param {string} content - The current content
  * @param {string} newLine - The string to append. Will be prepend with "\n"
  * @returns {boolean}
  */
yeoman.generators.Base.prototype.appendLine = function (content, newLine) {
  return content + '\n' + newLine;
};

/**
  * From an JavaScript collection (object or array), will apply a given function to all its
  * primitive values and will recursively apply to all others.
  * @param {object | array} obj - The starting collection to apply the function
  * @param {function} fn - The function to apply to all primitive values
  * @params {boolean} [clone=false] - Flag. If false, apply directly fn to the values. If true, 
  * clone the collection so you can be a bit more immutable
  * @returns {object | array}
  */
yeoman.generators.Base.prototype.recursiveApply = function (obj, fn, clone) {
  if (clone) {
    obj = this._.clone(obj);
  }

  this._.forEach(obj, function (value, key) {
    if (this._.isArray(value)) {
      obj[key] = this._.map(value, fn);
    } else if(this._.isObject(value)) {
      this.recursiveApply(value, fn, clone);
    } else {
      obj[key] = fn(value);
    }
  }, this);

  return obj;
};


// ###############################################################################################
// ###############################################################################################
//
// TEMPLATING ENGINES
//
// ###############################################################################################
// ###############################################################################################

yeoman.generators.Base.prototype.mustacheEngine = function (text, data) {
  return this._.template(text, data, {
    escape: /{{-([\s\S]+?)}}/g,
    evaluate: /{{([\s\S]+?)}}/g,
    interpolate: /{{=([\s\S]+?)}}/g
  });
};

yeoman.generators.Base.prototype.underscoreEngine = function (text, data) {
  return this._.template(text, data, {
    escape: /_-([\s\S]+?)_/g,
    evaluate: /_([\s\S]+?)_/g,
    interpolate: /_=([\s\S]+?)_/g
  });
};

yeoman.generators.Base.prototype.engines = function () {
  return {
    'default': this.engine,
    'underscore': this.underscoreEngine,
    'mustache': this.mustacheEngine
  };
};

yeoman.generators.Base.prototype.recursiveEngine = function (engine, obj, data) {
  return this.recursiveApply(obj, function (value) {
    if (this._.isString(value)) {
      return engine.call(this, value, data);
    } else {
      return value;
    }
  }.bind(this));
};

yeoman.generators.Base.prototype.recursiveMustacheEngine = function (obj, data) {
  return this.recursiveEngine(this.mustacheEngine, obj, data);
};

yeoman.generators.Base.prototype.recursiveUnderscoreEngine = function (obj, data) {
  return this.recursiveEngine(this.underscoreEngine, obj, data);
};

yeoman.generators.Base.prototype.recursiveDefaultEngine = function (obj, data) {
  return this.recursiveEngine(this.engine, obj, data);
};

yeoman.generators.Base.prototype.recursiveEngines = function () {
  return {
    'default': this.recursiveDefaultEngine,
    'underscore': this.recursiveUnderscoreEngine,
    'mustache': this.recursiveMustacheEngine
  };
};


// ###############################################################################################
// ###############################################################################################
//
// REAL STUFF
//
// ###############################################################################################
// ###############################################################################################

util.inherits(TemplateBase, yeoman.generators.Base);

TemplateBase.prototype.print = function (msg, context) {
  if (this._.isString(msg)) {
    yeoman.generators.Base.prototype.log.write(msg, context);
  } else {
    console && console.log(arguments);
  }
};

TemplateBase.prototype.debug = function (msg, context) {
  if (this.logLevel === 'debug') {
    this.print(msg, context);
  }
};

TemplateBase.prototype.getConfigPath = function () {
  return path.join(this.paths.root, this.constants.CONFIG_FILE);
};

TemplateBase.prototype.readConfig = function () {
  return this.readFileAsJson(this.getConfigPath(), this.constants.DEFAULT_CONFIG);
};

TemplateBase.prototype.writeConfig = function () {
  this.writeFileFromJson(this.getConfigPath(), this.config);
};

function getConfRegex(key) {
  return new RegExp('^' + key + '=(.*)$', 'm');
}

TemplateBase.prototype.readConfAsString = function (env) {
  env = env || 'application';
  return this.readFileAsString(path.join(this.paths.conf, env + '.conf'));
};

TemplateBase.prototype.writeConfFromString = function (stringConf, env) {
  env = env || 'application';
  return this.writeFileFromString(stringConf, path.join(this.paths.conf, env + '.conf'));
};

TemplateBase.prototype.hasConf = function (key, env) {
  return getConfRegex(key).test(this.readConfAsString(env));
};

TemplateBase.prototype.getAllConfs = function (subkey, env) {
  // TODO: wrong, do not work, correct it when time
  return getConfRegex('[^=]*' + subkey + '[^=]*').exec(this.readConfAsString(env));
};

TemplateBase.prototype.getConf = function (key, env) {
  return getConfRegex(key).exec(this.readConfAsString(env))[1];
};

TemplateBase.prototype.setConf = function (key, value, env) {
  if (this.hasConf(key, value)) {
    this.writeConfFromString(this.readConfAsString(env).replace( getConfRegex(key), key + '=' + value ), env);
  } else {
    this.writeConfFromString(this.readConfAsString(env) + '\n' + key + '=' + value, env);
  }
};

// Possible statuses:
// - write      default
// - writeln    default
// - ok         green
// - skip       yellow
// - force      yellow
// - create     green
// - invoke     bold
// - conflict   red
// - identical  cyan
// - info       grey
TemplateBase.prototype._log = function (status, message) {
  if (message) {
    this.log[status](message);
  } else {
    this.log[status]();
  }
};

TemplateBase.prototype._emptyLine = function () {
  this._log('write', '');
};

TemplateBase.prototype.mergeJson = function (source1, source2) {
  return this._.merge(source1, source2, function (a, b) {
    return this._.isArray(a) ? this._.uniq(a.concat(b), function (value) {
      return this._.isObject(value) || this._.isArray(value) ? JSON.stringify(value) : value;
    }) : undefined;
  });
};

TemplateBase.prototype.updateJson = function (path, content) {
  if (content && this.existsFile(path)) {
    var data = this.readFileAsJson(path);
    data = this.this._merge(data, content);
    this.writeFileFromJson(path, data);
  }
};


// ###############################################################################################
// ###############################################################################################
//
// LOAD TEMPLATE INSTANCE
//
// ###############################################################################################
// ###############################################################################################

// Do not mix this.paths (== paths used by the process) and this.config.paths (== paths where to look for templates)
TemplateBase.prototype.getTemplatePaths = function () {
  return (this.config.paths || []).concat(this.constants['DEFAULT_PATHS']);
};

TemplateBase.prototype.isLocalPath = function (path) {
  return this._.str.startsWith(path, "/");
};

// Check if a path exists, locally or remotely
TemplateBase.prototype.checkPath = function (rootPath) {
  var deferred = q.defer();

  if (this.isLocalPath(rootPath)) {
    var instancePath = path.join(rootPath, this.instance.name);
    this._log('info', '  ' + chalk.green('local') + '  ' + instancePath);
    if (this.existsFile(instancePath)) {
      deferred.resolve(instancePath);
    } else {
      deferred.resolve(undefined);
    }
  } else {
    var url = rootPath + (this._.str.endsWith(rootPath, '/') ? '' : '/') + this.instance.name;
    this._log('info', '  ' + chalk.red('remote') + ' ' + url);
    request({
      url: url,
      method: 'HEAD'
    }, function (error, response) {
      if (error) {
        this.emit('error', error);
        deferred.resolve(undefined);
      } else {
        deferred.resolve(response);
      }
    }.bind(this));
  }

  return deferred.promise;
};

// Filter paths to keep only valid ones
// Reject if:
// - no path (seems legit)
// - promise has been rejected
// - no value
// - remote path with a status code !== 200
TemplateBase.prototype.filterPaths = function (paths) {
  this._log('info', '');
  this._log('info', 'Filtering paths...');

  return this._(paths)
    .filter(function (path) {
      return path && path.state === 'fulfilled' && path.value;
    })
    .map(function (path) {
      return path.value;
    })
    .filter(function (path) {
      return !path.statusCode || path.statusCode === 200;
    })
    .map(function (path) {
      if (this._.isString(path)) {
        return {
          localPath: path
        };
      } else {
        return path;
      }
    }, this)
    .value();
};

// If multiple possible paths, ask user which one he wants to use,
// if only one, use it,
// if none, crash (and do it the hard way!)
TemplateBase.prototype.chooseInstancePath = function (paths) {
  var deferred = q.defer();

  if (paths.length > 1) {
    var prompts = [{
      type: "list",
      name: "path",
      message: "Which template do you want to use?",
      choices: this._.map(paths, function (path) {
        return {
          name: path.localPath || path.request.uri.href,
          value: path
        };
      })
    }];

    this.prompt(prompts, function (props, err) {
      if (err) {
        deferred.reject(err);
      }

      deferred.resolve(props.path);
    }.bind(this));
  }
  else if (paths.length === 1) {
    deferred.resolve(paths[0]);
  }
  else {
    deferred.reject('No template found for name "' + this.instance.name + '" at paths [' + this.instance.rootPaths.join(', ') + ']');
  }

  return deferred.promise;
};

// In case of a remote path (no localPath property), download it from the powerful internet
// Formats:
// - GitHub repo: ok
// - tar file: TODO
TemplateBase.prototype.downloadIfRemote = function (path) {
  var deferred = q.defer();
  if (path && !path.localPath) {
    this._log('info', '');
    this._log('info', 'Downloading template...');

    if (this._.str.include(path.request.uri.host, 'github')) {
      var data = path.request.uri.path.split('/');
      if (data[0] === '') {
        data.shift();
      }

      var github = {
        repo: data[0],
        user: data[1],
        branch: this.instance.options.branch || 'master'
      };

      this.remote(github.repo, github.user, github.branch, function(err, remote) {
        if (err) {
          deferred.reject(err);
        } else {
          path.localPath = remote.cachePath;
          deferred.resolve(path);
        }
      });
    }
  } else {
    deferred.resolve(path);
  }

  return deferred.promise;
};

TemplateBase.prototype.callIfDefined = function (property) {
  if (this.instance.content && this.instance.content[property]) {
    this.instance.content[property].call(this);
  }
};


// ###############################################################################################
// ###############################################################################################
//
// WRITE TEMPLATE FILES
//
// ###############################################################################################
// ###############################################################################################

TemplateBase.prototype.writeDir = function (currentPath) {
  var files = fs.readdirSync(currentPath);
  this._(files)
    .map(function (file) {
      return path.join(currentPath, file);
    })
    .reject(function (filePath) {
      var relativeFilePath = filePath.substr(this.instance.path.localPath.length + 1);
      var excluded = false;

      if (this.instance.content && this.instance.content.files) {
        this._.forEach(this.instance.content.files, function (value, pattern) {
          // Only try to match if the pattern can exclude and the file isn't excluded yet
          // and if the pattern match the relative path (meaning the path relative to the localPath of the instance)
          if (!excluded && value.excluded && this.minimatch(relativeFilePath, pattern)) {
            excluded = eval(value.excluded);
          }
          
        }, this);
      }
      
      return excluded;
    }, this)
    .forEach(function (filePath) {
      var stat = fs.statSync(filePath);
      stat.isDirectory() ? this.writeDir(filePath) : this.writeFile(filePath);
    }, this);
};

TemplateBase.prototype.writeFile = function (filePath) {
  var destinationPath = this.underscoreEngine(filePath, this.instance).replace(this.instance.path.localPath, this.paths.root);
  this.template(filePath, destinationPath, this.instance);
};


// ###############################################################################################
// ###############################################################################################
//
// UPDATE CONFIGURATION FILES
//
// ###############################################################################################
// ###############################################################################################

// Structure of a config file
// type: [String= json | properties | grunt]
// path: String: the path
// content

TemplateBase.prototype.updateConfigFile = function (configFile) {
  configFile.localPath = this.paths.root + configFile.path;

  // Config can only update an existing file
  if (!this.existsFile(configFile.localPath)) {
    return;
  }

  switch (configFile.type.toLowerCase()) {
    case 'json': this.updateJsonConfigFile(configFile); break;
    case 'properties': this.updatePropertiesConfigFile(configFile); break;
    case 'grunt': this.updateGruntConfigFile(configFile); break;
    case 'gruntfile': this.updateGruntConfigFile(configFile); break;
    default: break;
  }
};

TemplateBase.prototype.updateJsonConfigFile = function (configFile) {
  this.updateJson(configFile.localPath, configFile.content);
};

TemplateBase.prototype.updatePropertiesConfigFile = function (configFile) {
  // TODO
};

// EXPERIMENTAL
TemplateBase.prototype.updateGruntConfigFile = function (configFile) {
  var gruntfile = this.readFileAsString(configFile.localPath);

  var startToken = 'initConfig(';
  var endToken = ');';
  var startConfig = gruntfile.indexOf(startToken) + startToken.length;
  var endConfig = gruntfile.indexOf(endToken, startConfig);

  var gruntConfig = gruntfile.substring(startConfig, endConfig);

  // Preserve all JavaScript variables inside the Gruntfile
  var variables = ['configuration'];
  var variablesMapping = {};
  this._.forEach(variables, function (variable) {
    var stringVariable = '@{' + variable + '}';
    variablesMapping[variable] = stringVariable;
    gruntConfig = gruntConfig.replace(variable, 'variablesMapping.' + variable);
  });

  var gruntConfigObject;
  eval('gruntConfigObject = ' + gruntConfig);
  gruntConfigObject = this.mergeJson(gruntConfigObject, this.instance.content.grunt);

  gruntConfig = JSON.stringify(gruntConfigObject, null, '  ');

  this._.forEach(variablesMapping, function (stringVariable, variable) {
    gruntConfig = gruntConfig.replace('\\' + stringVariable + '\\', variable);
  });

  gruntfile = gruntfile.substring(0, startConfig) + gruntConfig + gruntfile.substring(endConfig);

  this.writeFileFromString(gruntfile, configFile.localPath);
};


// ###############################################################################################
// ###############################################################################################
//
// CONFIGURATION MODULE
//
// ###############################################################################################
// ###############################################################################################

TemplateBase.prototype.configLoadCommands = function () {
  return {
    // All commands about handling paths
    // Syntax inspired from "git remote" command
    path: {
      _aliases: {
        'ls': 'list',
        'rm': 'remove',
        '+': 'add',
        '-': 'remove'
      },
      // List all available paths with indicator about being local or remote
      list: function () {
        this._log('ok', 'List of all path:');
        this._emptyLine();

        this._.forEach(this.getTemplatePaths(), function (path) {
          this._log('writeln', '  ' + (this.isLocalPath(path) ? chalk.green('local') + ' ' : chalk.red('remote')) + '  ' + path);
        }, this);

        this._emptyLine();
      },
      // Add a new path to the config
      add: function (path) {
        this._log('ok', 'Add path: ' + path);
        this._emptyLine();

        this.config.paths = this._.union(this.config.paths, [path]);
      },
      // Remove a path from the config
      // You can only remove added paths (default paths will always be available)
      remove: function (path) {
        if (this._.find(this.config.paths, path)) {
          this._log('ok', 'Remove path: ' + path);
          this._emptyLine();

          this.config.paths = this._.without(this.config.paths, path);
        } else {
          this.emit('error', 'Remove failed. Unknow path "' + path + '"');
          this._emptyLine();
        }
      }
    }
  };
};

TemplateBase.prototype.configHandleCommand = function (level) {
  var commandFunction = this._.isFunction(this.currentCommand) && this.currentCommand || this.currentCommand._function;

  if (commandFunction) {
    commandFunction.apply(this, this.args.slice(level));
  } else if (this.args.length > level) {
    var subcommand = this.args[level];
    subcommand = (this.currentCommand._aliases && this.currentCommand._aliases[subcommand]) || subcommand;

    if (this.currentCommand[subcommand]) {
      this.currentCommand = this.currentCommand[subcommand];
      return this.configHandleCommand.call(this, level + 1);
    } else {
      return this.emit('error', 'Unknow command. Possible values are: path.');
    }
  } else {
    return this.emit('error', 'Unknow command.');
  }
};


// ###############################################################################################
// ###############################################################################################
//
// EXPERIMENTAL
//
// ###############################################################################################
// ###############################################################################################

TemplateBase.prototype.promptLoop = function (prompts, done) {
  var self = this;
  var results = [];
  var isEnded = false;
  var isMultiple = this._.isArray(prompts);
  prompts = isMultiple ? prompts : [prompts];

  var cb = self.async();

  // Return true if the value should stop the loop
  // Possible values are null, undefined or empty string
  // Otherwise, return false
  function isQuitAnswer (promptValue) {
    return this._.isUndefined(promptValue) || this._.isNull(promptValue) || promptValue === "";
  }

  // Handle a prompt by updating the answer with its value
  // or end the loop
  function handlePrompt (prompt, props, answer) {
    var promptName = prompt.name;
    var promptValue = props[promptName];
    self.print(promptName, promptValue);

    if (isQuitAnswer(promptValue)) {
      self.debug('>> End prompt loop because of empty answer');
      isEnded = true;
    } else {
      answer[promptName] = promptValue;
    }
  }

  // Perform one iteration of the loop.
  // Depending on the answer(s), will call itself
  // to iterate one more step or stop the loop.
  function ask () {
    self.prompt(prompts, function (props, err) {
      if (err) {
        self.debug('>> End prompt loop because of error: ', err);
        isEnded = true;
        done(results, err);
      }

      var answer = {};

      this._.map(prompts, function (prompt) {
        handlePrompt(prompt, props, answer);
      });

      if (!isEnded) {
        results.push(isMultiple ? answer : answer[prompts[0].name]);
        self.debug('Ask one more time. Current status: ', results);
        ask();
      } else {
        self.debug('End of prompt loop. Final status: ', results);
        done(results, null);
      }
    }.bind(self));
  }
  
  // Ask at least one time the prompts
  ask();
};
