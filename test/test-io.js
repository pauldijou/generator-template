'use strict';

var path = require('path');
var assert = require('assert');
var helpers = require('yeoman-generator').test;
var generator = helpers.createGenerator('template:app', ['./app']);
var test = require('../utils/test.js');

var sampleJson = {
  key1: 'value1',
  key2: ['array1', 1, true],
  key3: 42,
  key4: false,
  key5: {
    key51: 'value51',
    key52: 52
  }
};

describe('Generator IO', function () {
  it('should find files', function () {
    assert.strictEqual(true, generator.existsFile(test.filePath('sample.json')), 'sample.json');
    assert.strictEqual(false, generator.existsFile(test.filePath('notFound.json')), 'notFound.json');
  });

  it('should read JSON', function () {
    assert.deepEqual(sampleJson, generator.readFileAsJson(test.filePath('sample.json')));
    assert.deepEqual(undefined, generator.readFileAsJson(test.filePath('notFound.json')));
    assert.deepEqual({value: 'default'}, generator.readFileAsJson(test.filePath('notFound.json'), {value: 'default'}));
  });
});