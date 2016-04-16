/* */ 
(function(Buffer) {
  var AWS = require('./core');
  AWS.ParamValidator = AWS.util.inherit({
    constructor: function ParamValidator(validation) {
      if (validation === true || validation === undefined) {
        validation = {'min': true};
      }
      this.validation = validation;
    },
    validate: function validate(shape, params, context) {
      this.errors = [];
      this.validateMember(shape, params || {}, context || 'params');
      if (this.errors.length > 1) {
        var msg = this.errors.join('\n* ');
        msg = 'There were ' + this.errors.length + ' validation errors:\n* ' + msg;
        throw AWS.util.error(new Error(msg), {
          code: 'MultipleValidationErrors',
          errors: this.errors
        });
      } else if (this.errors.length === 1) {
        throw this.errors[0];
      } else {
        return true;
      }
    },
    fail: function fail(code, message) {
      this.errors.push(AWS.util.error(new Error(message), {code: code}));
    },
    validateStructure: function validateStructure(shape, params, context) {
      this.validateType(params, context, ['object'], 'structure');
      var paramName;
      for (var i = 0; shape.required && i < shape.required.length; i++) {
        paramName = shape.required[i];
        var value = params[paramName];
        if (value === undefined || value === null) {
          this.fail('MissingRequiredParameter', 'Missing required key \'' + paramName + '\' in ' + context);
        }
      }
      for (paramName in params) {
        if (!params.hasOwnProperty(paramName))
          continue;
        var paramValue = params[paramName],
            memberShape = shape.members[paramName];
        if (memberShape !== undefined) {
          var memberContext = [context, paramName].join('.');
          this.validateMember(memberShape, paramValue, memberContext);
        } else {
          this.fail('UnexpectedParameter', 'Unexpected key \'' + paramName + '\' found in ' + context);
        }
      }
      return true;
    },
    validateMember: function validateMember(shape, param, context) {
      switch (shape.type) {
        case 'structure':
          return this.validateStructure(shape, param, context);
        case 'list':
          return this.validateList(shape, param, context);
        case 'map':
          return this.validateMap(shape, param, context);
        default:
          return this.validateScalar(shape, param, context);
      }
    },
    validateList: function validateList(shape, params, context) {
      if (this.validateType(params, context, [Array])) {
        this.validateRange(shape, params.length, context, 'list member count');
        for (var i = 0; i < params.length; i++) {
          this.validateMember(shape.member, params[i], context + '[' + i + ']');
        }
      }
    },
    validateMap: function validateMap(shape, params, context) {
      if (this.validateType(params, context, ['object'], 'map')) {
        var mapCount = 0;
        for (var param in params) {
          if (!params.hasOwnProperty(param))
            continue;
          this.validateMember(shape.key, param, context + '[key=\'' + param + '\']');
          this.validateMember(shape.value, params[param], context + '[\'' + param + '\']');
          mapCount++;
        }
        this.validateRange(shape, mapCount, context, 'map member count');
      }
    },
    validateScalar: function validateScalar(shape, value, context) {
      switch (shape.type) {
        case null:
        case undefined:
        case 'string':
          return this.validateString(shape, value, context);
        case 'base64':
        case 'binary':
          return this.validatePayload(value, context);
        case 'integer':
        case 'float':
          return this.validateNumber(shape, value, context);
        case 'boolean':
          return this.validateType(value, context, ['boolean']);
        case 'timestamp':
          return this.validateType(value, context, [Date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'number'], 'Date object, ISO-8601 string, or a UNIX timestamp');
        default:
          return this.fail('UnkownType', 'Unhandled type ' + shape.type + ' for ' + context);
      }
    },
    validateString: function validateString(shape, value, context) {
      if (this.validateType(value, context, ['string'])) {
        this.validateEnum(shape, value, context);
        this.validateRange(shape, value.length, context, 'string length');
        this.validatePattern(shape, value, context);
      }
    },
    validatePattern: function validatePattern(shape, value, context) {
      if (this.validation['pattern'] && shape['pattern'] !== undefined) {
        if (!(new RegExp(shape['pattern'])).test(value)) {
          this.fail('PatternMatchError', 'Provided value "' + value + '" ' + 'does not match regex pattern /' + shape['pattern'] + '/ for ' + context);
        }
      }
    },
    validateRange: function validateRange(shape, value, context, descriptor) {
      if (this.validation['min']) {
        if (shape['min'] !== undefined && value < shape['min']) {
          this.fail('MinRangeError', 'Expected ' + descriptor + ' >= ' + shape['min'] + ', but found ' + value + ' for ' + context);
        }
      }
      if (this.validation['max']) {
        if (shape['max'] !== undefined && value > shape['max']) {
          this.fail('MaxRangeError', 'Expected ' + descriptor + ' <= ' + shape['max'] + ', but found ' + value + ' for ' + context);
        }
      }
    },
    validateEnum: function validateRange(shape, value, context) {
      if (this.validation['enum'] && shape['enum'] !== undefined) {
        if (shape['enum'].indexOf(value) === -1) {
          this.fail('EnumError', 'Found string value of ' + value + ', but ' + 'expected ' + shape['enum'].join('|') + ' for ' + context);
        }
      }
    },
    validateType: function validateType(value, context, acceptedTypes, type) {
      if (value === null || value === undefined)
        return false;
      var foundInvalidType = false;
      for (var i = 0; i < acceptedTypes.length; i++) {
        if (typeof acceptedTypes[i] === 'string') {
          if (typeof value === acceptedTypes[i])
            return true;
        } else if (acceptedTypes[i] instanceof RegExp) {
          if ((value || '').toString().match(acceptedTypes[i]))
            return true;
        } else {
          if (value instanceof acceptedTypes[i])
            return true;
          if (AWS.util.isType(value, acceptedTypes[i]))
            return true;
          if (!type && !foundInvalidType)
            acceptedTypes = acceptedTypes.slice();
          acceptedTypes[i] = AWS.util.typeName(acceptedTypes[i]);
        }
        foundInvalidType = true;
      }
      var acceptedType = type;
      if (!acceptedType) {
        acceptedType = acceptedTypes.join(', ').replace(/,([^,]+)$/, ', or$1');
      }
      var vowel = acceptedType.match(/^[aeiou]/i) ? 'n' : '';
      this.fail('InvalidParameterType', 'Expected ' + context + ' to be a' + vowel + ' ' + acceptedType);
      return false;
    },
    validateNumber: function validateNumber(shape, value, context) {
      if (value === null || value === undefined)
        return;
      if (typeof value === 'string') {
        var castedValue = parseFloat(value);
        if (castedValue.toString() === value)
          value = castedValue;
      }
      if (this.validateType(value, context, ['number'])) {
        this.validateRange(shape, value, context, 'numeric value');
      }
    },
    validatePayload: function validatePayload(value, context) {
      if (value === null || value === undefined)
        return;
      if (typeof value === 'string')
        return;
      if (value && typeof value.byteLength === 'number')
        return;
      if (AWS.util.isNode()) {
        var Stream = AWS.util.nodeRequire('stream').Stream;
        if (AWS.util.Buffer.isBuffer(value) || value instanceof Stream)
          return;
      }
      var types = ['Buffer', 'Stream', 'File', 'Blob', 'ArrayBuffer', 'DataView'];
      if (value) {
        for (var i = 0; i < types.length; i++) {
          if (AWS.util.isType(value, types[i]))
            return;
          if (AWS.util.typeName(value.constructor) === types[i])
            return;
        }
      }
      this.fail('InvalidParameterType', 'Expected ' + context + ' to be a ' + 'string, Buffer, Stream, Blob, or typed array object');
    }
  });
})(require('buffer').Buffer);
