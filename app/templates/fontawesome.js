module.exports = {
  "engine": "mustache",
  "prompts": [{
    "type": "input",
    "name": "version",
    "message": "Which version do you want to install?",
    "default": "~3.2.0"
  }],
  "bower": {
    "dependencies": {
      "font-awesome": "{{= prompts.version}}"
    }
  },
  "grunt": {
    "copy": {
      "bowerFontAwesome": {
        "files": [{
          "expand": true,
          "cwd": "<%= config.dir.bower.root %>/font-awesome/font/",
          "src": ["*"],
          "dest": "<%= config.dir.public.fonts %>/vendors/fontawesome/"
        }]
      }
    },
    "parallel": {
      "options": {
        "grunt": true
      },
      "bowerCopy": {
        "tasks": [
          "copy:bowerFontAwesome"
        ]
      }
    }
  }
}
