/* */ 
(function(process) {
  function each(obj, iter) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        iter(key, obj[key]);
    }
  }
  function nextString(str) {
    return 'S' + (parseInt(str.substr(1), 36) + 1).toString(36);
  }
  function Translator(api, options) {
    var origLength = JSON.stringify(api, null, 2).length;
    var debugInfo = {
      flattened: {},
      pruned: {}
    };
    var shapeName = 'S0';
    var shapeNameMap = {};
    var visitedShapes = {};
    function logResults() {
      console.log('** Generated', api.metadata.endpointPrefix + '-' + api.metadata.apiVersion + '.min.json' + (process.env.DEBUG ? ':' : ''));
      if (process.env.DEBUG) {
        var pruned = Object.keys(debugInfo.pruned);
        var flattened = Object.keys(debugInfo.flattened);
        var newLength = JSON.stringify(api, null, 2).length;
        console.log('- Pruned Shapes:', pruned.length);
        console.log('- Flattened Shapes:', flattened.length);
        console.log('- Remaining Shapes:', Object.keys(api.shapes).length);
        console.log('- Original Size:', origLength / 1024.0, 'kb');
        console.log('- Minified Size:', newLength / 1024.0, 'kb');
        console.log('- Size Saving:', (origLength - newLength) / 1024.0, 'kb');
        console.log('');
      }
    }
    function deleteTraits(obj) {
      if (!options.documentation) {
        delete obj.documentation;
        delete obj.documentationUrl;
        delete obj.errors;
        delete obj.min;
        delete obj.max;
        delete obj.pattern;
        delete obj['enum'];
        delete obj.box;
      }
    }
    function trackShapeDeclaration(ref) {
      if (ref.shape && !shapeNameMap[ref.shape]) {
        var oldShapeName = ref.shape;
        ref.shape = shapeName = nextString(shapeName);
        visitedShapes[shapeName] = api.shapes[oldShapeName];
        shapeNameMap[oldShapeName] = {
          name: shapeName,
          refs: [ref]
        };
        traverseShapeRef(api.shapes[oldShapeName]);
      } else if (ref.shape && shapeNameMap[ref.shape]) {
        var map = shapeNameMap[ref.shape];
        map.refs.push(ref);
        ref.shape = map.name;
      }
    }
    function pruneShapes() {
      each(shapeNameMap, function(name, map) {
        if (Object.keys(visitedShapes[map.name]).join() === 'type' && ['structure', 'map', 'list'].indexOf(visitedShapes[map.name].type) < 0) {
          for (var i = 0; i < map.refs.length; i++) {
            var ref = map.refs[i];
            debugInfo.flattened[name] = true;
            delete ref.shape;
            ref.type = visitedShapes[map.name].type;
            if (ref.type === 'string')
              delete ref.type;
          }
          delete visitedShapes[map.name];
          debugInfo.pruned[name] = true;
        } else if (map.refs.length === 1) {
          var shape = visitedShapes[map.name];
          for (var i = 0; i < map.refs.length; i++) {
            delete map.refs[i].shape;
            for (var prop in shape) {
              if (shape.hasOwnProperty(prop))
                map.refs[i][prop] = shape[prop];
            }
          }
          delete visitedShapes[map.name];
          debugInfo.pruned[name] = true;
        }
      });
    }
    function traverseShapeRef(ref) {
      if (!ref)
        return;
      deleteTraits(ref);
      traverseShapeRef(ref.key);
      traverseShapeRef(ref.value);
      traverseShapeRef(ref.member);
      each(ref.members || {}, function(key, value) {
        traverseShapeRef(value);
      });
      trackShapeDeclaration(ref);
    }
    function traverseOperation(op) {
      deleteTraits(op);
      delete op.name;
      if (op.http) {
        if (op.http.method === 'POST')
          delete op.http.method;
        if (op.http.requestUri === '/')
          delete op.http.requestUri;
        if (Object.keys(op.http).length === 0)
          delete op.http;
      }
      traverseShapeRef(op.input);
      traverseShapeRef(op.output);
    }
    function traverseApi() {
      deleteTraits(api);
      each(api.operations, function(name, op) {
        traverseOperation(op);
      });
      api.shapes = visitedShapes;
    }
    traverseApi();
    pruneShapes();
    logResults();
    return api;
  }
  module.exports = Translator;
})(require('process'));
