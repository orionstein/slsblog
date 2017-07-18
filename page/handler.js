'use strict'
const blogpage = require('../shared/bin/page.node')
const config = require('../shared/config/config.json')
const aws = require('aws-sdk')
const db = require('../shared/helpers/dynamoHelper.js')
const ramda = require('ramda')
const bb = require('bluebird')

// Your first function handler
module.exports.main = (event, context, cb) => {
  //Get post url from path
  const getUrl = ramda.path(['path', 'id'])(event)

  //Params to pull post
  let params = {
    TableName: config.database.postTable,
    IndexName: 'slsblog-url-index',
    KeyConditionExpression: '#Url = :url',
    ExpressionAttributeNames: {
      '#Url': 'Url',
    },
    ExpressionAttributeValues: {
      ':url': {
        S: getUrl,
      },
    },
    ScanIndexForward: false,
    Limit: 1,
  }
  return db.queryBlue(params).then(results => {
    const buildPostItem = item => {
      return {
        date: ramda.path(['Date', 'N'])(item),
        id: ramda.path(['postId', 'S'])(item),
        title: ramda.path(['Title', 'S'])(item),
        content: ramda.path(['Content', 'S'])(item),
        url: ramda.path(['Url', 'S'])(item),
        tags: ramda.pipe(
          ramda.path(['Tags', 'S']),
          ramda.when(ramda.equals('none'), ramda.always(null)),
          ramda.ifElse(ramda.is(String), ramda.split(','), ramda.always([]))
        )(item),
      }
    }
    const pullFromPosts = ramda.pipe(
      ramda.prop('Items'),
      ramda.map(buildPostItem),
      ramda.nth(0)
    )
    const post = pullFromPosts(results)
    // let ppost = {
    //   id: '123',
    //   content:
    //     'Back in March, I [gave a presentation](/refi/) at Redisconf. \n\n Here is the video! In hindsight, I would have approached it somewhat differently, but it was alright for a start. \n\n <video xmlns="http://www.w3.org/1999/xhtml" width="461" height="259" id="bcVideo" src="http://uds.ak.o.brightcove.com/2660431281001/2660431281001&#95;4137035063001&#95;Redis-Orion-Free.mp4" controls="controls"></video> \n\n You can get the accompanying slides [here](http://file.notsafeforproduction.com/servertoservercomm.pptx)\n\n',
    //   url: 'presentation',
    //   title: 'Presentation',
    //   tags: ['presentation', 'redis'],
    // }
    var html = blogpage.build(config.blog, post.content, post.title, post.tags)
    context.succeed(html)
  })
}

// You can add more handlers here, and reference them in serverless.yml
