var aws = require('aws-sdk');
var bluebird = require('bluebird');

var s3 = new aws.S3(
  {
    region: 'us-east-1',
  });

var promises3 = bluebird.promisifyAll(s3);

module.exports = promises3;
