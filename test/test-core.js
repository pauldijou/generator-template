'use strict';

var assert = require('assert');
var helpers = require('yeoman-generator').test;
var generator = helpers.createGenerator('template:app', ['./app']);

describe('Generator core', function () {
  it('Should return false for non-defined values', function () {
    assert.strictEqual(true, generator.isDefined('string'), 'String');
    assert.strictEqual(true, generator.isDefined(''), 'Empty string');
    assert.strictEqual(true, generator.isDefined(0), 'Zero');
    assert.strictEqual(true, generator.isDefined(-1), 'Minus one');
    assert.strictEqual(true, generator.isDefined(1), 'One');
    assert.strictEqual(true, generator.isDefined([]), 'Empty array');
    assert.strictEqual(true, generator.isDefined(true), 'True');
    assert.strictEqual(true, generator.isDefined(false), 'False');
    assert.strictEqual(false, generator.isDefined(), 'No parameters');
    assert.strictEqual(false, generator.isDefined(undefined), 'Undefined');
    assert.strictEqual(false, generator.isDefined(null), 'Null');
  });
});