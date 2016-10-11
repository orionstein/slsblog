'use strict';

// Your first function handler
module.exports.main = (event, context, cb) => {
  let html = "<html><head></head><body><div>tttessst</div></body></html>";
  context.succeed(html);
};

// You can add more handlers here, and reference them in serverless.yml
