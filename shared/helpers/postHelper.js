let doc = require('./dynamoDocHelper');
let db = require('./dynamoHelper');
let s3 = require('./s3Helper');
let msgpack = require('msgpack');
let config = require('../../templates/config.json');

function createPost(title, content, tags, url) {
  var params = {
    TableName: config.database.postTable,
    Limit: 1,
    IndexName: 'status-orderDate-index',
    KeyConditionExpression: "#status = :ok",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":ok": { "S": "OK" }
    },
    ScanIndexForward: false
  };
}

function updatePost(id, title, content, tags, url) {

}

function deletePost(title, content, tags, url) {

}

function getPost(id) {

}

function getPosts(from, to) {

}

module.exports = {
  createPost: createPost,
  updatePost: updatePost,
  deletePost: deletePost,
  getPost: getPost,
  getPosts: getPosts
};
