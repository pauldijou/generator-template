var path = require('path');

var test = module.exports;

test.inDirectory = path.join(__dirname, '../test/in/');
test.outDirectory = path.join(__dirname, '../test/out/');

test.filePath = function (fileName) {
  return path.join(test.inDirectory, fileName);
}

test.mockPromptLoop = function (generator, results) {
	var resultIndex = 0;
  var origPromptLoop = generator.promptLoop;
  generator.promptLoop = function (prompts, done) {
    done(results[resultIndex++], null);
  };
  generator.origPromptLoop = origPromptLoop;
};