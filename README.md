# Generator Template
[![Build Status](https://secure.travis-ci.org/pauldijou/generator-play.png?branch=master)](https://travis-ci.org/pauldijou/generator-template)

A Yeoman generator to bootstrap and improve projects from predefined templates.

## Getting started
- Make sure you have [yo](https://github.com/yeoman/yo) installed:
    `npm install -g yo`
- Install the generator **locally**: `npm install generator-template`
- Run: `yo template [name of a template]`

## Templates rule the world!

A `template` is just a directory, in your machine or remotely fetched (like from a git repository). It will be imported as a node module.
Depending on its configuration, you might be asked some questions. Then, all files in the directory will be copied inside your project
with their content modified (or not) based on your answer.

## License
[MIT License](http://en.wikipedia.org/wiki/MIT_License)
