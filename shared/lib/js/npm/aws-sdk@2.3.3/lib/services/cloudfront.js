/* */ 
var AWS = require('../core');
require('../cloudfront/signer');
AWS.util.update(AWS.CloudFront.prototype, {setupRequestListeners: function setupRequestListeners(request) {
    request.addListener('extractData', AWS.util.hoistPayloadMember);
  }});
