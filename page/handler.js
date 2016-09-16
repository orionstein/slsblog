'use strict';
let blogpage = require('../shared/testPage.node');
let config = require('../templates/config.json');

// Your first function handler
module.exports.main = (event, context, cb) => {
  let post = {
    id: '123',
    content: 'Back in March, I [gave a presentation](/refi/) at Redisconf. \n\n Here is the video! In hindsight, I would have approached it somewhat differently, but it was alright for a start. \n\n <video xmlns="http://www.w3.org/1999/xhtml" width="461" height="259" id="bcVideo" src="http://uds.ak.o.brightcove.com/2660431281001/2660431281001&#95;4137035063001&#95;Redis-Orion-Free.mp4" controls="controls"></video> \n\n You can get the accompanying slides [here](http://file.notsafeforproduction.com/servertoservercomm.pptx)\n\n',
    url: 'presentation',
    title: 'Presentation',
    tags: ['presentation', 'redis']
  };
  var html = blogpage.build(config, post.content);
  context.succeed(html);
};

// You can add more handlers here, and reference them in serverless.yml
