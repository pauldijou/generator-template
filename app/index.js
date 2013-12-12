'use strict';
var Util = require('util');
var FS = require('fs');
var Q = require('q');
var TemplateBase = require('../utils/template-base');

// ----------------------------------------------------------------------------
// Generator configuration
// ----------------------------------------------------------------------------

var TemplateGenerator = module.exports = function TemplateGenerator(args, options, config) {
  TemplateBase.apply(this, arguments);

  this.argument('templateName', {
    // truth to be told, it is required, but since I don't like the default message, I will do it my own way
    'required': false,
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

Util.inherits(TemplateGenerator, TemplateBase);

// ----------------------------------------------------------------------------
// Load template
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.loadTemplate = function (opts) {
  this.templateName = this.templateName || (opts && opts.defaultTemplateName);

  if (!this.templateName) {
    return this.emit('error', 'You must specify a template name!');
  }

  // If path specified, only check this one,
  // otherwise, check all configured path + source root of generator
  this.rootPaths = (this.options.path && [this.options.path]) || this.getTemplatePaths();

  // Asynchrounsly check which paths exist
  this._log('info', 'Looking for your template at the following paths:');
  this.containerPaths = this._.map(this.rootPaths, this.checkPath, this);
  
  var cb = this.async();
  var self = this;

  var filterPaths = this._.bind(this.filterPaths, this);
  var chooseTemplatePath = this._.bind(this.chooseTemplatePath, this);
  var downloadIfRemote = this._.bind(this.downloadIfRemote, this);

  // When all checks completed...
  Q.allSettled(this.containerPaths)
    .then(filterPaths)
    .then(chooseTemplatePath)
    .then(downloadIfRemote)
    .done(function (path) {
      if (!path || !path.localPath) {
        return self.emit('error', 'Invalid path: ' + JSON.stringify(path));
      }

      self.templatePath = path;

      try {
        self.stats = FS.statSync( self.templatePath.localPath );

        // Load the content of the template which should be a valid Node module
        self.content = require( self.templatePath.localPath );

        if (!self.content) {
          return self.emit('error', 'No module file found for name "' + self.templateName + '" at path "' + self.templatePath.localPath + '"');
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
  this.callIfDefined.call(this, 'welcome');
};

// ----------------------------------------------------------------------------
// Handle prompts
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.prePrompts = function (opts) {
  this.callIfDefined.call(this, 'prePrompts');
};

TemplateGenerator.prototype.doPrompts = function (opts) {
  if (this.content && this.content.prompts) {
    var cb = this.async();

    this.prompts = {};

    this.prompt(this.content.prompts, function (props, err) {
      if (err) {
        return this.emit('error', err);
      }

      this.prompts = props;

      // Template the content of the template using the engine of your choice (default, underscore, mustache)
      // It will replace all placeholders inside the strings of the content with their evaluated value
      this.content = this.recursiveEngines()[this.content.engine || 'default'].call(this, this.content, this);

      cb();
    }.bind(this));
  }
};

TemplateGenerator.prototype.postPrompts = function (opts) {
  this.callIfDefined.call(this, 'postPrompts');
};

// ----------------------------------------------------------------------------
// Write files
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.writeFiles = function (opts) {
  if (this.content && this.stats.isDirectory()) {
    this.writeDir(this.templatePath.localPath);
  }
};

TemplateGenerator.prototype.postWriteFiles = function (opts) {
  this.callIfDefined.call(this, 'postWriteFiles');
};

// ----------------------------------------------------------------------------
// Update project configuration files
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.updateConfFiles = function (opts) {
  if (this.content) {
    this._.forEach(this.content.configuration, function (configFile) {
      this.updateConfigFile(configFile);
    }, this);
  }
};

TemplateGenerator.prototype.postUpdateConfFiles = function (opts) {
  this.callIfDefined.call(this, 'postUpdateConfFiles');
};

// ----------------------------------------------------------------------------
// Say goodbye and hope he will use you again...
// ----------------------------------------------------------------------------

TemplateGenerator.prototype.bye = function (opts) {
  this.callIfDefined.call(this, 'bye');
};
