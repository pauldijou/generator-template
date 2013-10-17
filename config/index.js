'use strict';
var util = require('util');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var TemplateBase = require('../utils/template-base');

var ConfigGenerator = module.exports = function ConfigGenerator(args, options, config) {
  TemplateBase.apply(this, arguments);

  this.commands = this._loadCommands();
};

util.inherits(ConfigGenerator, TemplateBase);

ConfigGenerator.prototype.doConfig = function () {
  this.command = this.args[0];

  if (!this.command) {
    return this.emit('error', 'You need to specify a command to run.');
  }

  if (this.command && this.commands[this.command]) {
    this.currentCommand = this.commands[this.command];
    this._handleCommand.call(this, 1);
    this.writeConfig();
  } else {
    return this.emit('error', 'Unknow command.aze.');
  }
}

ConfigGenerator.prototype._loadCommands = function () {
  return {
    path: {
      _aliases: {
        'ls': 'list',
        'rm': 'remove',
        '+': 'add',
        '-': 'remove'
      },
      list: function () {
        this._log('ok', 'List of all path:');
        this._emptyLine();

        this._.forEach(this.getTemplatePaths(), function (path) {
          this._log('writeln', '  ' + (this.isLocalPath(path) ? chalk.green('local') + ' ' : chalk.red('remote')) + '  ' + path);
        }, this);

        this._emptyLine();
      },
      add: function (path) {
        this._log('ok', 'Add path: ' + path);
        this._emptyLine();

        this.config.paths = this._.union(this.config.paths, [path]);
      },
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
  }
}

ConfigGenerator.prototype._handleCommand = function (level) {
  var commandFunction = this._.isFunction(this.currentCommand) && this.currentCommand || this.currentCommand._function;

  if (commandFunction) {
    commandFunction.apply(this, this.args.slice(level));
  } else if (this.args.length > level) {
    var subcommand = this.args[level];
    subcommand = (this.currentCommand._aliases && this.currentCommand._aliases[subcommand]) || subcommand;

    if (this.currentCommand[subcommand]) {
      this.currentCommand = this.currentCommand[subcommand];
      return this._handleCommand.call(this, level + 1);
    } else {
      return this.emit('error', 'Unknow command. Possible values are: path.');
    }
  } else {
    return this.emit('error', 'Unknow command.');
  }
}
