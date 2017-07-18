'use strict'
var fsSync = require('fs')
var bb = require('bluebird')

const fs = bb.promisifyAll(fsSync)

// Your first function handler
module.exports.main = (event, context, cb) => {
  return bb
    .all([
      fs.readFileSync('./admin/elm-app.js', 'utf8'),
      fs.readFileSync('./admin/app.js', 'utf8'),
    ])
    .then(scripts => {
      let html =
        '<!doctype html><html><head>' +
        '<meta http-equiv="Content-Type" content="text/html" charset="UTF-8">' +
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">' +
        '</head><body>' +
        '<script>' +
        scripts[0] +
        '</script>' +
        '<script>' +
        scripts[1] +
        '</script>' +
        '</body></html>'
      context.succeed(html)
    })
}

// You can add more handlers here, and reference them in serverless.yml
