'use strict'
const blogmain = require('../shared/bin/home.node')
const config = require('../shared/config/config.json')
const aws = require('aws-sdk')
const db = require('../shared/helpers/dynamoHelper.js')
const ramda = require('ramda')
const dateExpr = '#date <= :date and #tagName = :tag'
const dateNextExpr = '#date < :date and #tagName = :tag'
const datePrevExpr = '#date > :date and #tagName = :tag'
const bb = require('bluebird')
const moment = require('moment')

// Your first function handler
module.exports.main = (event, context, cb) => {
  //Get tag name from path
  const tagName = ramda.path(['path', 'tagName'])(event)

  if (tagName) {
    config.blog.tagName = tagName
  } else {
    delete config.blog.tagName
  }

  //Get paging if not on first page
  const pagingFrom = ramda.path(['query', 'from'])(event)

  //Default params to pull most recent posts
  let params = {
    TableName: config.database.tagTable,
    KeyConditionExpression: '#tagName = :tag',
    ExpressionAttributeNames: {
      '#tagName': 'tagName',
    },
    ExpressionAttributeValues: {
      ':tag': {
        S: tagName,
      },
    },
    ScanIndexForward: false,
    Limit: event.count || 10,
  }

  //Params to pull posts if paging data available
  if (pagingFrom) {
    params = {
      TableName: config.database.tagTable,
      KeyConditionExpression: dateExpr,
      ExpressionAttributeNames: {
        '#date': 'Date',
      },
      ExpressionAttributeValues: {
        ':tag': {
          S: tagName,
        },
        ':date': {
          N: pagingFrom,
        },
      },
      ScanIndexForward: false,
      Limit: event.count || 10,
    }
  }

  // let posts = [
  //   {
  //     id: '123',
  //     title: 'New Post',
  //     date: new Date(),
  //     snippet: 'Meadfee...',
  //     url: '',
  //   },
  //   {
  //     id: '124',
  //     title: 'Presentation',
  //     date: new Date(),
  //     snippet:
  //       'Back in March, I [gave a presentation](/refi/) at Redisconf.<br /><br />Here is the video! In hindsight...',
  //     url: '',
  //   },
  // ]

  return db.queryBlue(params).then(function(data) {
    //Fn to flatten posts from dynamodb return
    //
    console.log('dt', JSON.stringify(data))

    const formatInv = ramda.invoker(1, 'format')

    const buildPostItem = item => {
      return {
        date: ramda.pipe(
          ramda.path(['Date', 'N']),
          parseInt,
          moment,
          formatInv('MMMM DD YYYY')
        )(item),
        id: ramda.path(['postId', 'S'])(item),
        title: ramda.path(['Title', 'S'])(item),
        snippet: ramda.path(['Snippet', 'S'])(item),
        url: ramda.path(['Url', 'S'])(item),
      }
    }
    const pullFromPosts = ramda.map(
      ramda.pipe(ramda.prop('Item'), buildPostItem)
    )

    const buildGetItem = id => {
      const getItemParams = {
        TableName: config.database.postTable,
        Key: {
          postId: {
            S: id,
          },
        },
      }
      console.log('jjj', getItemParams)
      return db.getItemBlue(getItemParams)
    }

    const getPosts = ramda.pipe(
      ramda.prop('Items'),
      ramda.map(ramda.path(['postId', 'S'])),
      ramda.map(buildGetItem)
    )

    if (data.Count > 0) {
      //Checking for any further posts, check one item further to see if posts exist
      const fromDate = ramda.path(['LastEvaluatedKey', 'Date', 'N'])(data)
      const getCheckMoreParams = date => ({
        TableName: config.database.tagTable,
        KeyConditionExpression: dateNextExpr,
        ExpressionAttributeNames: {
          '#date': 'Date',
          '#tagName': 'tagName',
        },
        ExpressionAttributeValues: {
          ':tag': {
            S: tagName,
          },
          ':date': {
            N: date,
          },
        },
        ScanIndexForward: false,
        Limit: 1,
      })

      //Checking for any previous posts, check one page beforehand to see if posts exist
      const prevDate = ramda.path(['Items', '0', 'Date', 'N'])(data)
      const getCheckPrevParams = date => ({
        TableName: config.database.tagTable,
        KeyConditionExpression: datePrevExpr,
        ExpressionAttributeNames: {
          '#date': 'Date',
          '#tagName': 'tagName',
        },
        ExpressionAttributeValues: {
          ':tag': {
            S: tagName,
          },
          ':date': {
            N: date,
          },
        },
        ScanIndexForward: true,
        Limit: event.count || 10,
      })

      //Build out promise array. If there are dates to check from, push query,
      //otherwise push dummy promise - if db is empty, don't run breaking calls
      // let promArr = [getPosts(data)]
      return bb.all(getPosts(data)).then(function(allposts) {
        console.log('GOT')
        console.log('allposts', allposts)

        const posts = pullFromPosts(allposts)

        console.log(fromDate)
        console.log(prevDate)

        const promArr = []
        if (!ramda.isNil(fromDate)) {
          promArr.push(db.queryBlue(getCheckMoreParams(fromDate)))
        } else {
          promArr.push(new bb.Promise((res, rej) => res({})))
        }
        if (!ramda.isNil(prevDate)) {
          promArr.push(db.queryBlue(getCheckPrevParams(prevDate)))
        } else {
          promArr.push(new bb.Promise((res, rej) => res({})))
        }

        return bb.all(promArr).then(function(results) {
          console.log('res', JSON.stringify(results))
          //If next results, set next id and flag
          //Otherwise, delete flag, for lamda cache fixing
          if (prevDate && results[0] && results[0].Count > 0) {
            config.blog.hasMore = true
            config.blog.nextId = ramda.pipe(
              ramda.nth(0),
              ramda.prop('Items'),
              ramda.last,
              ramda.path(['Date', 'N'])
            )(results)
          } else {
            delete config.blog.hasMore
            delete config.blog.nextId
          }

          //If previous results, set previous id and flag
          //Otherwise, delete flag, for lamda cache fixing
          if (prevDate && results[1] && results[1].Count > 0) {
            config.blog.hasPrev = true
            config.blog.prevId = ramda.pipe(
              ramda.nth(1),
              ramda.prop('Items'),
              ramda.last,
              ramda.path(['Date', 'N'])
            )(results)
          } else {
            delete config.blog.hasPrev
            delete config.blog.prevId
          }

          console.log('aaaaah?')
          console.log('aaaaaht?', config.blog)
          console.log('aaaaahtaa?', posts)

          //Run rust plugin for html rendering, and return html result
          const html = blogmain.build(config.blog, posts)
          console.log('aaagtt', html)
          return context.succeed(html)
        })
      })
    } else {
      //Run rust plugin for html rendering, and return html result
      const html = blogmain.build(config.blog, posts)
      return context.succeed(html)
    }
  })
}
