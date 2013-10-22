'use strict';
var util = require('util');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var TemplateBase = require('../utils/template-base');

var ConfigGenerator = module.exports = function ConfigGenerator(args, options, config) {
  TemplateBase.apply(this, arguments);

  this.commands = this.configLoadCommands();
};

util.inherits(ConfigGenerator, TemplateBase);

ConfigGenerator.prototype.doConfig = function () {
  this.command = this.args[0];

  if (!this.command) {
    return this.emit('error', 'You need to specify a command to run.');
  }

  if (this.command && this.commands[this.command]) {
    this.currentCommand = this.commands[this.command];
    this.configHandleCommand.call(this, 1);
    this.writeConfig();
  } else {
    return this.emit('error', 'Unknow command.aze.');
  }
}
