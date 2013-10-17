'use strict';
var util = require('util');
var fs = require('fs');
var q = require('q');
var TemplateBase = require('../utils/template-base');

// ----------------------------------------------------------------------------
// Generator configuration
// ----------------------------------------------------------------------------

var TemplateGenerator = module.exports = function TemplateGenerator(args, options, config) {
  TemplateBase.apply(this, arguments);

  this.argument('templateName', {
    'required': false, // truth to be told, it is required, but since I don't like the default message, I will do it my own way
    'optional': true,
    'type': String,
    'desc': 'The name of your template. Must match a node module inside at least one of your configured paths.'
  });

  this.option('path', {
    'type': String,
    'desc': 'Manually specify a path to retrieve your template. If present, all other paths will be ignored.'
  });

  this.option('branch', {
    'type': String,
    'desc': 'The Git branch to use when downloading the template. Only useful if the template is stored on a GitHub repo right now.'
  });
};

TemplateGenerator.Base = TemplateBase;

util.inherits(TemplateGenerator, TemplateBase);

// ----------------------------------------------------------------------------
// Load the instance configuration
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.loadInstance = function (opts) {
  this.instance = {};
  this.instance.config = this.config;
  this.instance.name = this.templateName || (opts && opts.defaultTemplateName);
  this.instance.options = this.options;

  if (!this.instance.name) {
    return this.emit('error', 'You must specify a template name!');
  }

  // If path specified, only check self one,
  // otherwise, check all configured path + source root of generator
  this.instance.rootPaths = (this.options.path && [this.options.path]) || this.getTemplatePaths();

  // Asynchrounsly check which paths exist
  this._log('info', 'Looking for your template at the following paths:');
  this.instance.paths = this._.map(this.instance.rootPaths, this._checkPath, this);
  
  var cb = this.async();
  var self = this;

  var filterPaths = this._.bind(this._filterPaths, this);
  var chooseInstancePath = this._.bind(this._chooseInstancePath, this);
  var downloadIfRemote = this._.bind(this._downloadIfRemote, this);

  // When all checks completed...
  q.allSettled(this.instance.paths)
    .then(filterPaths)
    .then(chooseInstancePath)
    .then(downloadIfRemote)
    .done(function (path) {
      if (!path || !path.localPath) {
        return self.emit('error', 'Invalid path: ' + JSON.stringify(path));
      }

      self.instance.path = path;

      try {
        self.instance.stats = fs.statSync( self.instance.path.localPath );
        self.instance.content = require( self.instance.path.localPath );
        if (!self.instance.content) {
          return self.emit('error', 'No module file found for name "' + self.instance.name + '" at path "' + self.instance.path.localPath + '"');
        }
      }
      catch (e) {
        return self.emit('error', e);
      }

      cb();
    }, function (error) {
      self.emit('error', error);
      cb();
    });
};

// ----------------------------------------------------------------------------
// Say hello to the nice user
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.welcome = function (opts) {
  if (this.instance.content && this.instance.content.welcome) {
    this._.forEach(this.instance.content.welcome, function (w) {
      this.this._log(w.status, w.message);
    }, this)
  }
};

// ----------------------------------------------------------------------------
// Handle prompts
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.prePrompts = function (opts) {
  if (this.instance.content && this.instance.content.prePrompts) {
    this.instance.content.prePrompts.call(this);
  }
};

TemplateGenerator.prototype.doPrompts = function (opts) {
  if (this.instance.content && this.instance.content.prompts) {
    var cb = this.async();

    this.instance.prompts = {};

    this.prompt(this.instance.content.prompts, function (props, err) {
      if (err) {
        return this.emit('error', err);
      }

      this.instance.prompts = props;
      this.instance.content = this.recursiveEngines()[this.instance.content.engine || 'default'].call(this, this.instance.content, this.instance);
      
      this.log.write();

      cb();
    }.bind(this));
  }
};

TemplateGenerator.prototype.postPrompts = function (opts) {
  if (this.instance.content && this.instance.content.postPrompts) {
    this.instance.content.postPrompts.call(this);
  }
};

// ----------------------------------------------------------------------------
// Write files
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.writeFiles = function (opts) {
  if (this.instance.path && this.instance.stats.isDirectory()) {
    this.writeDir(this.instance.path.localPath);
  }
};

TemplateGenerator.prototype.postWriteFiles = function (opts) {
  if (this.instance.content && this.instance.content.postWriteFiles) {
    this.instance.content.postWriteFiles.call(this);
  }
};

// ----------------------------------------------------------------------------
// Update project configuration files
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.writeConfFiles = function (opts) {
  if (this.instance.content) {
    var packagePath = this.paths.root + '/package.json';
    var bowerPath = this.paths.root + '/bower.json';
    var gruntPath = this.paths.root + '/Gruntfile.js';

    this.updateJson(packagePath, 'package');
    this.updateJson(bowerPath, 'bower');

    if (this.instance.content.grunt && this.existsFile(gruntPath)) {
      var gruntfile = this.readFileAsString(gruntPath);

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

      this.writeFileFromString(gruntfile, 'Gruntfile.js');
    }
  }
};

TemplateGenerator.prototype.postWriteConfFiles = function (opts) {
  if (this.instance.content && this.instance.content.postWriteConfFiles) {
    this.instance.content.postWriteConfFiles.call(this);
  }
}

// ----------------------------------------------------------------------------
// Say goodbye and hope he will use you again...
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.bye = function (opts) {
  if (this.instance.content && this.instance.content.bye) {
    this._.forEach(this.instance.content.bye, function (w) {
      this._log(w.status, w.message);
    }.bind(this))
  }
};
