/* */ 
var $export = require('./_export'),
    aFunction = require('./_a-function'),
    anObject = require('./_an-object'),
    rApply = (require('./_global').Reflect || {}).apply,
    fApply = Function.apply;
$export($export.S + $export.F * !require('./_fails')(function() {
  rApply(function() {});
}), 'Reflect', {apply: function apply(target, thisArgument, argumentsList) {
    var T = aFunction(target),
        L = anObject(argumentsList);
    return rApply ? rApply(T, thisArgument, L) : fApply.call(T, thisArgument, L);
  }});
