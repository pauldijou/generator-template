module.exports = {
  "engine": "mustache",
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "~1.1.0"
  }],
  "bower": {
    "dependencies": {
      "restangular": "{{= prompts.version}}"
    }
  },
  "grunt": {
    "copy": {
      "bowerRestangular": {
        "files": [{
          "expand": true,
          "cwd": "<%= config.dir.bower.root %>/restangular/dist/",
          "src": ["restangular.js", "restangular.min.js"],
          "dest": "<%= config.dir.public.scripts %>/vendors/restangular/"
        }]
      }
    },
    "parallel": {
      "options": {
        "grunt": true
      },
      "bowerCopy": {
        "tasks": [
          "copy:bowerRestangular"
        ]
      }
    }
  }
}
