module.exports = {
  "engine": "mustache",
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "~2.0.0"
  }],
  "bower": {
    "dependencies": {
      "jquery": "{{= prompts.version}}"
    }
  },
  "grunt": {
    "copy": {
      "bowerJQuery": {
        "files": [{
          "expand": true,
          "cwd": "<%= config.dir.bower.root %>/jquery/",
          "src": ["jquery.js", "jquery.min.js"],
          "dest": "<%= config.dir.public.scripts %>/vendors/jquery/"
        }]
      }
    },
    "parallel": {
      "options": {
        "grunt": true
      },
      "bowerCopy": {
        "tasks": [
          "copy:bowerJQuery"
        ]
      }
    }
  }
}
