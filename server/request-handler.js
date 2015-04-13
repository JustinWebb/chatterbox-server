/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

module.exports = function(request, response) {
  // Request and Response come from node's http module.
  // http://nodejs.org/documentation/api/
  console.log("Serving request type " + request.method + " for url " + request.url);

  var statusCode = 200;
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = "text/plain";
  response.writeHead(statusCode, headers);

  /* Make sure to always call response.end() - Node may not send
     anything back to the client until you do. The string you pass to
     response.end() will be the body of the response - i.e. what shows
     up in the browser.

     Calling .end "flushes" the response's internal buffer, forcing
     node to actually send all the data over to the client. */
  response.end("Hello, World!");
};

/* These headers will allow Cross-Origin Resource Sharing (CORS).
 This code allows this server to talk to websites that
 are on different domains, for instance, your chat client.

 Your chat client is running from a url like file:your/chat/client/index.html,
 which is considered a different domain.

 Another way to get around this restriction is to serve you chat
 client from this domain by setting up static file serving. */
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

