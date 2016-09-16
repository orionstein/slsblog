'use strict';
let blogmain = require('../shared/test2.node');
let config = require('../templates/config.json');

// Your first function handler
module.exports.main = (event, context, cb) => {

  let posts = [
    {
      id: '123',
      title: 'New Post',
      date: new Date(),
      snippet: 'Meadfee...',
      url: ''
    },
    {
      id: '124',
      title: 'Presentation',
      date: new Date(),
      snippet: 'Back in March, I [gave a presentation](/refi/) at Redisconf.<br /><br />Here is the video! In hindsight...',
      url: ''
    }
  ];
  console.log(config.blog);

  var html = blogmain.build(config.blog, posts);
  context.succeed(html);
};

// You can add more handlers here, and reference them in serverless.yml
