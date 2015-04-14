/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var _ = require('underscore');
var messages = [];
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};
addMessage = function ( data ){
  //generate a unique objectId
  //append objectId to data
  data.objectId=messages.length;//first one will be 0
  //append createdAt to data
  data.createdAt = Date.now();
  //append modifiedAt to data?

  //save the data in messages
  messages.push(data);
  //return the objectId
  return data.objectId;
}

module.exports = {

  requestHandler: function(request, response) {
    // Request and Response come from node's http module.
    // http://nodejs.org/documentation/api/
    console.log("Serving request type " + request.method + " for url " + request.url);

    // Setup initial repsonse header
    var statusCode = 200;
    var headers = defaultCorsHeaders;
    headers['Content-Type'] = "text/plain";

    /* Make sure to always call response.end() - Node may not send
       anything back to the client until you do. The string you pass to
       response.end() will be the body of the response - i.e. what shows
       up in the browser.

       Calling .end "flushes" the response's internal buffer, forcing
       node to actually send all the data over to the client.
    */
    //if the url is invalid
    var goodURIs = [
      '/classes/messages',
      '/classes/room'
    ];
    var isValid=false;
    //CHECK FOR BAD URIS AND BAIL OUT
    _.each(goodURIs, function (elem, i) {
      if (request.url.indexOf(elem) === 0) {
        isValid=true;
      }
    });

    if(!isValid){
      statusCode = 404;
      response.writeHead(statusCode, headers);
      response.end('{}');
    } else if (request.method === 'OPTIONS') {
      response.writeHead(statusCode, headers);
      response.end('{}');
    } else if (request.method === 'GET') {
      var resp = {};
      resp.results = messages;
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify(resp));
    } else if (request.method === 'POST') {
      var body = '';
      request.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        if (body.length > 1e6)
          request.connection.destroy();
      });
      request.on('end', function () {
        console.log('POST');

        var id = addMessage( JSON.parse(body) );

        statusCode = 201;
        response.writeHead(statusCode, headers);
        response.end(JSON.stringify({objectId:id}));
      });
    }
  }
};

/* These headers will allow Cross-Origin Resource Sharing (CORS).
 This code allows this server to talk to websites that
 are on different domains, for instance, your chat client.

 Your chat client is running from a url like file:your/chat/client/index.html,
 which is considered a different domain.

 Another way to get around this restriction is to serve you chat
 client from this domain by setting up static file serving. */


