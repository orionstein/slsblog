'use strict';
var blogmain = require('../shared/test.node');

// Your first function handler
module.exports.main = (event, context, cb) => {

  var posts = [
    {
      id: '123',
      title: 'New Post',
      date: new Date(),
      snippet: 'Meadfee...',
      url: 'new_post'
    },
    {
      id: '124',
      title: 'Presentation',
      date: new Date(),
      snippet: 'Back in March, I [gave a presentation](/refi/) at Redisconf.<br /><br />Here is the video! In hindsight...',
      url: 'new_post'
    }
      
  ];

  var html = blogmain.build();
  context.succeed(html);
};

// You can add more handlers here, and reference them in serverless.yml
