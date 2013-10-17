module.exports = {
  "engine": "mustache",
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "~1.3.0"
  }],
  "bower": {
    "dependencies": {
      "lodash": "{{= instance.prompts.version}}"
    }
  },
  "grunt": {
    "copy": {
      "bowerLodash": {
        "files": [{
          "expand": true,
          "cwd": "<%= config.dir.bower.root %>/lodash/dist/",
          "src": ["lodash.js", "lodash.min.js"],
          "dest": "<%= config.dir.public.scripts %>/vendors/lodash/"
        }]
      }
    },
    "parallel": {
      "options": {
        "grunt": true
      },
      "bowerCopy": {
        "tasks": [
          "copy:bowerLodash"
        ]
      }
    }
  }
}
