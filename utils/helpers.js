'use strict';
var _ = require('lodash');

exports.inquirer = {};

exports.inquirer.toInt = function () {
  return function (input) {
    return _.parseInt(input);
  }
}

exports.inquirer.toBoolean = function () {
  return function (input) {
    return !!input;
  }
}

exports.inquirer.toUndefined = function () {
  return function (input) {
    if (input === '') {
      return undefined;
    } else {
      return input;
    }
  }
}

exports.inquirer.required = function (msg) {
  return function (input) {
    if (exports.inquirer.toUndefined()(input) === undefined) {
      return msg || 'You must enter a value.'
    } else {
      return true;
    }
  }
}

exports.inquirer.regex = function (regex) {
  return function (input) {
    if (regex.test(input)) {
      return true;
    } else {
      return msg || 'You must enter a value.'
    }
  }
}
