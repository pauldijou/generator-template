module.exports = {
  "engine": "mustache",
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "~2.6.0"
  }],
  "bower": {
    "dependencies": {
      "modernizr": "{{= instance.prompts.version}}"
    }
  },
  "grunt": {
    "copy": {
      "bowerModernizr": {
        "files": [{
          "expand": true,
          "cwd": "<%= config.dir.bower.root %>/modernizr/",
          "src": ["modernizr.js"],
          "dest": "<%= config.dir.public.scripts %>/vendors/modernizr/"
        }]
      }
    },
    "parallel": {
      "options": {
        "grunt": true
      },
      "bowerCopy": {
        "tasks": [
          "copy:bowerModernizr"
        ]
      }
    }
  }
}
