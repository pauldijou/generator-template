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
  
  // Set paths
  this.paths = {
    'root': this.constants.PATH_ROOT
  };

  // Extend the Yeoman Generator Base
  this.pkg = this.readFileAsJson(path.join(this.paths.root, '/package.json'), {});
  this.config = this.readConfig();

  this.on('error', function (msg) {
    this.log.error(chalk.red('Error: ') + msg);
  });

  this.on("end", function () {
    this.writeConfig();
  });

  _.str = require('underscore.string');
  _.mixin(_.str.exports());

  this._ = _;
  this.chalk = chalk;
  this.minimatch = minimatch;
  this.helpers = helpers;
};

// Generic methods
yeoman.generators.Base.prototype.exists = function (val) {
	return !this._.isNull(val) && !this._.isUndefined(val);
};

yeoman.generators.Base.prototype.existsFile = function (path) {
	return fs.existsSync(path);
};

yeoman.generators.Base.prototype.readFileAsJson = function(path, defaultValue) {
	return this.existsFile(path) && JSON.parse(this.readFileAsString(path)) || defaultValue;
};

yeoman.generators.Base.prototype.writeFileFromJson = function(path, value, space) {
  space = space || "  ";
  return this.writeFileFromString(JSON.stringify(value, null, space), path);
};

yeoman.generators.Base.prototype.promptLoop = function (prompts, done) {
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
  };

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
  };

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
  };
  
  // Ask at least one time the prompts
  ask();
};

yeoman.generators.Base.prototype.appendLine = function (contentString, newLine) {
  return contentString + '\n' + newLine;
};

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

yeoman.generators.Base.prototype.recursiveEngine = function (engine, obj, data) {
  return this.recursiveApply(obj, function (value) {
    if (this._.isString(value)) {
      return engine.call(this, value, data);
    } else {
      return value;
    }
  }.bind(this));
};

yeoman.generators.Base.prototype.mustacheEngine = function (text, data) {
  return this._.template(text, data, {
    escape: /{{-([\s\S]+?)}}/g,
    evaluate: /{{([\s\S]+?)}}/g,
    interpolate: /{{=([\s\S]+?)}}/g
  });
};

yeoman.generators.Base.prototype.recursiveMustacheEngine = function (obj, data) {
  return this.recursiveEngine(this.mustacheEngine, obj, data);
};

yeoman.generators.Base.prototype.underscoreEngine = function (text, data) {
  return this._.template(text, data, {
    escape: /_-([\s\S]+?)_/g,
    evaluate: /_([\s\S]+?)_/g,
    interpolate: /_=([\s\S]+?)_/g
  });
};

yeoman.generators.Base.prototype.recursiveUnderscoreEngine = function (obj, data) {
  return this.recursiveEngine(this.underscoreEngine, obj, data);
};

yeoman.generators.Base.prototype.recursiveDefaultEngine = function (obj, data) {
  return this.recursiveEngine(this.engine, obj, data);
};

yeoman.generators.Base.prototype.engines = function () {
  return {
    'default': this.engine,
    'underscore': this.underscoreEngine,
    'mustache': this.mustacheEngine
  };
};

yeoman.generators.Base.prototype.recursiveEngines = function () {
  return {
    'default': this.recursiveDefaultEngine,
    'underscore': this.recursiveUnderscoreEngine,
    'mustache': this.recursiveMustacheEngine
  };
};

// Time to extend!
util.inherits(TemplateBase, yeoman.generators.Base);

TemplateBase.prototype.print = function (msg, context) {
  if (this._.isString(msg)) {
    yeoman.generators.Base.prototype.log.write(msg, context);
  } else {
    console.log(arguments);
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
};

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
}

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
            excluded = eval(value.excluded)
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

TemplateBase.prototype.mergeJson = function (source1, source2) {
  return this._.merge(source1, source2, function (a, b) {
    return this._.isArray(a) ? this._.uniq(a.concat(b), function (value) {
      return this._.isObject(value) || this._.isArray(value) ? JSON.stringify(value) : value;
    }) : undefined;
  });
};

TemplateBase.prototype.updateJson = function (path, property) {
  if (this.instance.content[property] && this.existsFile(path)) {
    var data = this.readFileAsJson(path);
    data = this.this._merge(data, this.instance.content[property]);
    this.writeFileFromJson(path, data);
  }
};

// Do not mix this.paths (== paths used by the process) and this.config.paths (== paths where to look for templates)
TemplateBase.prototype.getTemplatePaths = function () {
  return (this.config.paths || []).concat(this.constants['DEFAULT_PATHS']);
}

TemplateBase.prototype.isLocalPath = function (path) {
  return this._.str.startsWith(path, "/");
}

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
}

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
        }
      } else {
        return path;
      }
    }, this)
    .value();
}

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
        }
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
}

// In case of a remove path (no localPath property), download it from the powerful internet
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
}
