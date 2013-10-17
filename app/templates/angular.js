module.exports = {
  "engine": "mustache",
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "v1.2.0-rc.2"
  }],
  "bower": {
    "dependencies": {
      "angular": "{{= instance.prompts.version}}"
    }
  },
  "grunt": {
    "copy": {
      "bowerAngular": {
        "files": [{
          "expand": true,
          "cwd": "<%= config.dir.bower.root %>/angular/",
          "src": ["*.js"],
          "dest": "<%= config.dir.public.scripts %>/vendors/angular/"
        }]
      }
    },
    "parallel": {
      "options": {
        "grunt": true
      },
      "bowerCopy": {
        "tasks": [
          "copy:bowerAngular"
        ]
      }
    }
  }
}
