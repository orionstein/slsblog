'use strict'

var aws = require('aws-sdk')
var db = require('../../../shared/helpers/dynamoHelper.js')
var uuid = require('uuid-lib')
var config = require('../../../shared/config/config.json')
const ramda = require('ramda')
const bb = require('bluebird')

const checkItemExists = url => {
  let params = {
    TableName: config.database.postTable,
    IndexName: 'slsblog-url-index',
    KeyConditionExpression: '#Url = :url',
    ExpressionAttributeNames: {
      '#Url': 'Url',
    },
    ExpressionAttributeValues: {
      ':url': {
        S: url,
      },
    },
    ScanIndexForward: false,
    Limit: 1,
  }
  return db.queryBlue(params).then(results => {
    return results.Count > 0
  })
}

module.exports.main = function(event, context) {
  console.log('gogo!')
  console.log(event.body)
  console.log(event.body.body)
  var title = event.body.title
  var author = event.body.author
  var content = event.body.body
  var tags = event.body.tags
  var date = new Date()
  var snippet = event.body.snippet
  var url = event.body.url
  return checkItemExists(url).then(itemExists => {
    if (itemExists) {
      return context.fail(new Error('DuplicateUrl'))
    } else {
      const id = uuid.raw()
      var dbParams = {
        Item: {
          postId: {
            S: id,
          },
          Author: {
            S: author,
          },
          Status: {
            S: 'OK',
          },
          Snippet: {
            S: snippet,
          },
          Title: {
            S: title,
          },
          Tags: {
            S: tags,
          },
          Content: {
            S: content,
          },
          Url: {
            S: url,
          },
          Date: {
            N: date.getTime().toString(),
          },
        },
        TableName: config.database.postTable,
      }
      return (
        db
          .putItemBlue(dbParams)
          .then(function() {
            console.log('yarp')
            if (tags && ramda.is(String)(tags)) {
              const makePutTagProm = tagName => {
                var dbParams = {
                  Item: {
                    postId: {
                      S: id,
                    },
                    tagName: {
                      S: tagName,
                    },
                    Date: {
                      N: date.getTime().toString(),
                    },
                  },
                  TableName: config.database.tagTable,
                }
                return db.putItemBlue(dbParams)
              }
              const tagPromList = ramda.pipe(
                ramda.split(','),
                ramda.map(makePutTagProm)
              )(tags)
              return bb.all(tagPromList).then(() => {
                return context.succeed(true)
              })
            } else {
              return context.succeed(true)
            }
          })
          // .then(context.succeed)
          .catch(function(err) {
            console.log('nope')

            console.log(err)
            return context.fail(err)
          })
      )
    }
  })
}
