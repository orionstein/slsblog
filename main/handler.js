'use strict'
const blogmain = require('../shared/bin/home.node')
const config = require('../shared/config/config.json')
const aws = require('aws-sdk')
const db = require('../shared/helpers/dynamoHelper.js')
const ramda = require('ramda')
const dateExpr = '#date <= :date and #status = :ok'
const dateNextExpr = '#date < :date and #status = :ok'
const datePrevExpr = '#date > :date and #status = :ok'
const bb = require('bluebird')
const moment = require('moment')

// Your first function handler
module.exports.main = (event, context, cb) => {
  //Get paging if not on first page
  const pagingFrom = ramda.path(['query', 'from'])(event)

  //Default params to pull most recent posts
  let params = {
    TableName: config.database.postTable,
    IndexName: 'slsblog-status-date-index',
    KeyConditionExpression: '#Status = :ok',
    ExpressionAttributeNames: {
      '#Status': 'Status',
    },
    ExpressionAttributeValues: {
      ':ok': {
        S: 'OK',
      },
    },
    ScanIndexForward: false,
    Limit: event.count || 10,
  }

  //Params to pull posts if paging data available
  if (pagingFrom) {
    params = {
      TableName: config.database.postTable,
      IndexName: 'slsblog-status-date-index',
      KeyConditionExpression: dateExpr,
      ExpressionAttributeNames: {
        '#status': 'Status',
        '#date': 'Date',
      },
      ExpressionAttributeValues: {
        ':ok': {
          S: 'OK',
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
    const formatInv = ramda.invoker(1, 'format')
    const buildPostItem = item => {
      const date = ramda.path(['Date', 'N'])(item)
      const mdate = moment(parseInt(date))
      const aa = mdate.format('MMMM Do YYYY')
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

    const pullFromPosts = ramda.pipe(
      ramda.prop('Items'),
      ramda.map(buildPostItem)
    )
    const posts = pullFromPosts(data)

    if (data.Count > 0) {
      //Checking for any further posts, check one item further to see if posts exist
      const fromDate = ramda.path(['LastEvaluatedKey', 'Date', 'N'])(data)
      const checkMoreParams = {
        TableName: config.database.postTable,
        IndexName: 'slsblog-status-date-index',
        KeyConditionExpression: dateNextExpr,
        ExpressionAttributeNames: {
          '#status': 'Status',
          '#date': 'Date',
        },
        ExpressionAttributeValues: {
          ':ok': {
            S: 'OK',
          },
          ':date': {
            N: fromDate,
          },
        },
        ScanIndexForward: false,
        Limit: 1,
      }

      //Checking for any previous posts, check one page beforehand to see if posts exist
      const prevDate = ramda.path(['Items', '0', 'Date', 'N'])(data)
      const checkPrevParams = {
        TableName: config.database.postTable,
        IndexName: 'slsblog-status-date-index',
        KeyConditionExpression: datePrevExpr,
        ExpressionAttributeNames: {
          '#status': 'Status',
          '#date': 'Date',
        },
        ExpressionAttributeValues: {
          ':ok': {
            S: 'OK',
          },
          ':date': {
            N: prevDate,
          },
        },
        ScanIndexForward: true,
        Limit: event.count || 10,
      }

      //Build out promise array. If there are dates to check from, push query,
      //otherwise push dummy promise - if db is empty, don't run breaking calls
      let promArr = []
      if (fromDate) {
        promArr.push(db.queryBlue(checkMoreParams))
      } else {
        promArr.push(new bb.Promise((res, rej) => res({})))
      }
      if (prevDate) {
        promArr.push(db.queryBlue(checkPrevParams))
      } else {
        promArr.push(new bb.Promise((res, rej) => res({})))
      }

      return bb.all(promArr).then(function(results) {
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

        //Run rust plugin for html rendering, and return html result
        const html = blogmain.build(config.blog, posts)
        context.succeed(html)
      })
    } else {
      //Run rust plugin for html rendering, and return html result
      const html = blogmain.build(config.blog, posts)
      context.succeed(html)
    }
  })
}
