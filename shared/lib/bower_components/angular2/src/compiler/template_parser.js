'use strict';var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var collection_1 = require('angular2/src/facade/collection');
var lang_1 = require('angular2/src/facade/lang');
var core_1 = require('angular2/core');
var lang_2 = require('angular2/src/facade/lang');
var exceptions_1 = require('angular2/src/facade/exceptions');
var change_detection_1 = require('angular2/src/core/change_detection/change_detection');
var html_parser_1 = require('./html_parser');
var html_tags_1 = require('./html_tags');
var parse_util_1 = require('./parse_util');
var ast_1 = require('angular2/src/core/change_detection/parser/ast');
var template_ast_1 = require('./template_ast');
var selector_1 = require('angular2/src/compiler/selector');
var element_schema_registry_1 = require('angular2/src/compiler/schema/element_schema_registry');
var template_preparser_1 = require('./template_preparser');
var style_url_resolver_1 = require('./style_url_resolver');
var html_ast_1 = require('./html_ast');
var util_1 = require('./util');
// Group 1 = "bind-"
// Group 2 = "var-" or "#"
// Group 3 = "on-"
// Group 4 = "bindon-"
// Group 5 = the identifier after "bind-", "var-/#", or "on-"
// Group 6 = identifier inside [()]
// Group 7 = identifier inside []
// Group 8 = identifier inside ()
var BIND_NAME_REGEXP = /^(?:(?:(?:(bind-)|(var-|#)|(on-)|(bindon-))(.+))|\[\(([^\)]+)\)\]|\[([^\]]+)\]|\(([^\)]+)\))$/g;
var TEMPLATE_ELEMENT = 'template';
var TEMPLATE_ATTR = 'template';
var TEMPLATE_ATTR_PREFIX = '*';
var CLASS_ATTR = 'class';
var PROPERTY_PARTS_SEPARATOR = '.';
var ATTRIBUTE_PREFIX = 'attr';
var CLASS_PREFIX = 'class';
var STYLE_PREFIX = 'style';
var TEXT_CSS_SELECTOR = selector_1.CssSelector.parse('*')[0];
/**
 * Provides an array of {@link TemplateAstVisitor}s which will be used to transform
 * parsed templates before compilation is invoked, allowing custom expression syntax
 * and other advanced transformations.
 *
 * This is currently an internal-only feature and not meant for general use.
 */
exports.TEMPLATE_TRANSFORMS = lang_2.CONST_EXPR(new core_1.OpaqueToken('TemplateTransforms'));
var TemplateParseError = (function (_super) {
    __extends(TemplateParseError, _super);
    function TemplateParseError(message, span) {
        _super.call(this, span, message);
    }
    return TemplateParseError;
})(parse_util_1.ParseError);
exports.TemplateParseError = TemplateParseError;
var TemplateParseResult = (function () {
    function TemplateParseResult(templateAst, errors) {
        this.templateAst = templateAst;
        this.errors = errors;
    }
    return TemplateParseResult;
})();
exports.TemplateParseResult = TemplateParseResult;
var TemplateParser = (function () {
    function TemplateParser(_exprParser, _schemaRegistry, _htmlParser, transforms) {
        this._exprParser = _exprParser;
        this._schemaRegistry = _schemaRegistry;
        this._htmlParser = _htmlParser;
        this.transforms = transforms;
    }
    TemplateParser.prototype.parse = function (template, directives, pipes, templateUrl) {
        var result = this.tryParse(template, directives, pipes, templateUrl);
        if (lang_1.isPresent(result.errors)) {
            var errorString = result.errors.join('\n');
            throw new exceptions_1.BaseException("Template parse errors:\n" + errorString);
        }
        return result.templateAst;
    };
    TemplateParser.prototype.tryParse = function (template, directives, pipes, templateUrl) {
        var parseVisitor = new TemplateParseVisitor(directives, pipes, this._exprParser, this._schemaRegistry);
        var htmlAstWithErrors = this._htmlParser.parse(template, templateUrl);
        var result = html_ast_1.htmlVisitAll(parseVisitor, htmlAstWithErrors.rootNodes, EMPTY_COMPONENT);
        var errors = htmlAstWithErrors.errors.concat(parseVisitor.errors);
        if (errors.length > 0) {
            return new TemplateParseResult(result, errors);
        }
        if (lang_1.isPresent(this.transforms)) {
            this.transforms.forEach(function (transform) { result = template_ast_1.templateVisitAll(transform, result); });
        }
        return new TemplateParseResult(result);
    };
    TemplateParser = __decorate([
        core_1.Injectable(),
        __param(3, core_1.Optional()),
        __param(3, core_1.Inject(exports.TEMPLATE_TRANSFORMS)), 
        __metadata('design:paramtypes', [change_detection_1.Parser, element_schema_registry_1.ElementSchemaRegistry, html_parser_1.HtmlParser, Array])
    ], TemplateParser);
    return TemplateParser;
})();
exports.TemplateParser = TemplateParser;
var TemplateParseVisitor = (function () {
    function TemplateParseVisitor(directives, pipes, _exprParser, _schemaRegistry) {
        var _this = this;
        this._exprParser = _exprParser;
        this._schemaRegistry = _schemaRegistry;
        this.errors = [];
        this.directivesIndex = new Map();
        this.ngContentCount = 0;
        this.selectorMatcher = new selector_1.SelectorMatcher();
        collection_1.ListWrapper.forEachWithIndex(directives, function (directive, index) {
            var selector = selector_1.CssSelector.parse(directive.selector);
            _this.selectorMatcher.addSelectables(selector, directive);
            _this.directivesIndex.set(directive, index);
        });
        this.pipesByName = new Map();
        pipes.forEach(function (pipe) { return _this.pipesByName.set(pipe.name, pipe); });
    }
    TemplateParseVisitor.prototype._reportError = function (message, sourceSpan) {
        this.errors.push(new TemplateParseError(message, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseInterpolation = function (value, sourceSpan) {
        var sourceInfo = sourceSpan.start.toString();
        try {
            var ast = this._exprParser.parseInterpolation(value, sourceInfo);
            this._checkPipes(ast, sourceSpan);
            return ast;
        }
        catch (e) {
            this._reportError("" + e, sourceSpan);
            return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
        }
    };
    TemplateParseVisitor.prototype._parseAction = function (value, sourceSpan) {
        var sourceInfo = sourceSpan.start.toString();
        try {
            var ast = this._exprParser.parseAction(value, sourceInfo);
            this._checkPipes(ast, sourceSpan);
            return ast;
        }
        catch (e) {
            this._reportError("" + e, sourceSpan);
            return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
        }
    };
    TemplateParseVisitor.prototype._parseBinding = function (value, sourceSpan) {
        var sourceInfo = sourceSpan.start.toString();
        try {
            var ast = this._exprParser.parseBinding(value, sourceInfo);
            this._checkPipes(ast, sourceSpan);
            return ast;
        }
        catch (e) {
            this._reportError("" + e, sourceSpan);
            return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
        }
    };
    TemplateParseVisitor.prototype._parseTemplateBindings = function (value, sourceSpan) {
        var _this = this;
        var sourceInfo = sourceSpan.start.toString();
        try {
            var bindings = this._exprParser.parseTemplateBindings(value, sourceInfo);
            bindings.forEach(function (binding) {
                if (lang_1.isPresent(binding.expression)) {
                    _this._checkPipes(binding.expression, sourceSpan);
                }
            });
            return bindings;
        }
        catch (e) {
            this._reportError("" + e, sourceSpan);
            return [];
        }
    };
    TemplateParseVisitor.prototype._checkPipes = function (ast, sourceSpan) {
        var _this = this;
        if (lang_1.isPresent(ast)) {
            var collector = new PipeCollector();
            ast.visit(collector);
            collector.pipes.forEach(function (pipeName) {
                if (!_this.pipesByName.has(pipeName)) {
                    _this._reportError("The pipe '" + pipeName + "' could not be found", sourceSpan);
                }
            });
        }
    };
    TemplateParseVisitor.prototype.visitText = function (ast, component) {
        var ngContentIndex = component.findNgContentIndex(TEXT_CSS_SELECTOR);
        var expr = this._parseInterpolation(ast.value, ast.sourceSpan);
        if (lang_1.isPresent(expr)) {
            return new template_ast_1.BoundTextAst(expr, ngContentIndex, ast.sourceSpan);
        }
        else {
            return new template_ast_1.TextAst(ast.value, ngContentIndex, ast.sourceSpan);
        }
    };
    TemplateParseVisitor.prototype.visitAttr = function (ast, contex) {
        return new template_ast_1.AttrAst(ast.name, ast.value, ast.sourceSpan);
    };
    TemplateParseVisitor.prototype.visitComment = function (ast, context) { return null; };
    TemplateParseVisitor.prototype.visitElement = function (element, component) {
        var _this = this;
        var nodeName = element.name;
        var preparsedElement = template_preparser_1.preparseElement(element);
        if (preparsedElement.type === template_preparser_1.PreparsedElementType.SCRIPT ||
            preparsedElement.type === template_preparser_1.PreparsedElementType.STYLE) {
            // Skipping <script> for security reasons
            // Skipping <style> as we already processed them
            // in the StyleCompiler
            return null;
        }
        if (preparsedElement.type === template_preparser_1.PreparsedElementType.STYLESHEET &&
            style_url_resolver_1.isStyleUrlResolvable(preparsedElement.hrefAttr)) {
            // Skipping stylesheets with either relative urls or package scheme as we already processed
            // them in the StyleCompiler
            return null;
        }
        var matchableAttrs = [];
        var elementOrDirectiveProps = [];
        var vars = [];
        var events = [];
        var templateElementOrDirectiveProps = [];
        var templateVars = [];
        var templateMatchableAttrs = [];
        var hasInlineTemplates = false;
        var attrs = [];
        element.attrs.forEach(function (attr) {
            var hasBinding = _this._parseAttr(attr, matchableAttrs, elementOrDirectiveProps, events, vars);
            var hasTemplateBinding = _this._parseInlineTemplateBinding(attr, templateMatchableAttrs, templateElementOrDirectiveProps, templateVars);
            if (!hasBinding && !hasTemplateBinding) {
                // don't include the bindings as attributes as well in the AST
                attrs.push(_this.visitAttr(attr, null));
                matchableAttrs.push([attr.name, attr.value]);
            }
            if (hasTemplateBinding) {
                hasInlineTemplates = true;
            }
        });
        var lcElName = html_tags_1.splitNsName(nodeName.toLowerCase())[1];
        var isTemplateElement = lcElName == TEMPLATE_ELEMENT;
        var elementCssSelector = createElementCssSelector(nodeName, matchableAttrs);
        var directives = this._createDirectiveAsts(element.name, this._parseDirectives(this.selectorMatcher, elementCssSelector), elementOrDirectiveProps, isTemplateElement ? [] : vars, element.sourceSpan);
        var elementProps = this._createElementPropertyAsts(element.name, elementOrDirectiveProps, directives);
        var children = html_ast_1.htmlVisitAll(preparsedElement.nonBindable ? NON_BINDABLE_VISITOR : this, element.children, Component.create(directives));
        // Override the actual selector when the `ngProjectAs` attribute is provided
        var projectionSelector = lang_1.isPresent(preparsedElement.projectAs) ?
            selector_1.CssSelector.parse(preparsedElement.projectAs)[0] :
            elementCssSelector;
        var ngContentIndex = component.findNgContentIndex(projectionSelector);
        var parsedElement;
        if (preparsedElement.type === template_preparser_1.PreparsedElementType.NG_CONTENT) {
            if (lang_1.isPresent(element.children) && element.children.length > 0) {
                this._reportError("<ng-content> element cannot have content. <ng-content> must be immediately followed by </ng-content>", element.sourceSpan);
            }
            parsedElement = new template_ast_1.NgContentAst(this.ngContentCount++, hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
        }
        else if (isTemplateElement) {
            this._assertAllEventsPublishedByDirectives(directives, events);
            this._assertNoComponentsNorElementBindingsOnTemplate(directives, elementProps, element.sourceSpan);
            parsedElement = new template_ast_1.EmbeddedTemplateAst(attrs, events, vars, directives, children, hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
        }
        else {
            this._assertOnlyOneComponent(directives, element.sourceSpan);
            var elementExportAsVars = vars.filter(function (varAst) { return varAst.value.length === 0; });
            var ngContentIndex_1 = hasInlineTemplates ? null : component.findNgContentIndex(projectionSelector);
            parsedElement = new template_ast_1.ElementAst(nodeName, attrs, elementProps, events, elementExportAsVars, directives, children, hasInlineTemplates ? null : ngContentIndex_1, element.sourceSpan);
        }
        if (hasInlineTemplates) {
            var templateCssSelector = createElementCssSelector(TEMPLATE_ELEMENT, templateMatchableAttrs);
            var templateDirectives = this._createDirectiveAsts(element.name, this._parseDirectives(this.selectorMatcher, templateCssSelector), templateElementOrDirectiveProps, [], element.sourceSpan);
            var templateElementProps = this._createElementPropertyAsts(element.name, templateElementOrDirectiveProps, templateDirectives);
            this._assertNoComponentsNorElementBindingsOnTemplate(templateDirectives, templateElementProps, element.sourceSpan);
            parsedElement = new template_ast_1.EmbeddedTemplateAst([], [], templateVars, templateDirectives, [parsedElement], ngContentIndex, element.sourceSpan);
        }
        return parsedElement;
    };
    TemplateParseVisitor.prototype._parseInlineTemplateBinding = function (attr, targetMatchableAttrs, targetProps, targetVars) {
        var templateBindingsSource = null;
        if (attr.name == TEMPLATE_ATTR) {
            templateBindingsSource = attr.value;
        }
        else if (attr.name.startsWith(TEMPLATE_ATTR_PREFIX)) {
            var key = attr.name.substring(TEMPLATE_ATTR_PREFIX.length); // remove the star
            templateBindingsSource = (attr.value.length == 0) ? key : key + ' ' + attr.value;
        }
        if (lang_1.isPresent(templateBindingsSource)) {
            var bindings = this._parseTemplateBindings(templateBindingsSource, attr.sourceSpan);
            for (var i = 0; i < bindings.length; i++) {
                var binding = bindings[i];
                if (binding.keyIsVar) {
                    targetVars.push(new template_ast_1.VariableAst(binding.key, binding.name, attr.sourceSpan));
                    targetMatchableAttrs.push([binding.key, binding.name]);
                }
                else if (lang_1.isPresent(binding.expression)) {
                    this._parsePropertyAst(binding.key, binding.expression, attr.sourceSpan, targetMatchableAttrs, targetProps);
                }
                else {
                    targetMatchableAttrs.push([binding.key, '']);
                    this._parseLiteralAttr(binding.key, null, attr.sourceSpan, targetProps);
                }
            }
            return true;
        }
        return false;
    };
    TemplateParseVisitor.prototype._parseAttr = function (attr, targetMatchableAttrs, targetProps, targetEvents, targetVars) {
        var attrName = this._normalizeAttributeName(attr.name);
        var attrValue = attr.value;
        var bindParts = lang_1.RegExpWrapper.firstMatch(BIND_NAME_REGEXP, attrName);
        var hasBinding = false;
        if (lang_1.isPresent(bindParts)) {
            hasBinding = true;
            if (lang_1.isPresent(bindParts[1])) {
                this._parseProperty(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
            }
            else if (lang_1.isPresent(bindParts[2])) {
                var identifier = bindParts[5];
                this._parseVariable(identifier, attrValue, attr.sourceSpan, targetVars);
            }
            else if (lang_1.isPresent(bindParts[3])) {
                this._parseEvent(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
            }
            else if (lang_1.isPresent(bindParts[4])) {
                this._parseProperty(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
                this._parseAssignmentEvent(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
            }
            else if (lang_1.isPresent(bindParts[6])) {
                this._parseProperty(bindParts[6], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
                this._parseAssignmentEvent(bindParts[6], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
            }
            else if (lang_1.isPresent(bindParts[7])) {
                this._parseProperty(bindParts[7], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
            }
            else if (lang_1.isPresent(bindParts[8])) {
                this._parseEvent(bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
            }
        }
        else {
            hasBinding = this._parsePropertyInterpolation(attrName, attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
        }
        if (!hasBinding) {
            this._parseLiteralAttr(attrName, attrValue, attr.sourceSpan, targetProps);
        }
        return hasBinding;
    };
    TemplateParseVisitor.prototype._normalizeAttributeName = function (attrName) {
        return attrName.toLowerCase().startsWith('data-') ? attrName.substring(5) : attrName;
    };
    TemplateParseVisitor.prototype._parseVariable = function (identifier, value, sourceSpan, targetVars) {
        if (identifier.indexOf('-') > -1) {
            this._reportError("\"-\" is not allowed in variable names", sourceSpan);
        }
        targetVars.push(new template_ast_1.VariableAst(identifier, value, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseProperty = function (name, expression, sourceSpan, targetMatchableAttrs, targetProps) {
        this._parsePropertyAst(name, this._parseBinding(expression, sourceSpan), sourceSpan, targetMatchableAttrs, targetProps);
    };
    TemplateParseVisitor.prototype._parsePropertyInterpolation = function (name, value, sourceSpan, targetMatchableAttrs, targetProps) {
        var expr = this._parseInterpolation(value, sourceSpan);
        if (lang_1.isPresent(expr)) {
            this._parsePropertyAst(name, expr, sourceSpan, targetMatchableAttrs, targetProps);
            return true;
        }
        return false;
    };
    TemplateParseVisitor.prototype._parsePropertyAst = function (name, ast, sourceSpan, targetMatchableAttrs, targetProps) {
        targetMatchableAttrs.push([name, ast.source]);
        targetProps.push(new BoundElementOrDirectiveProperty(name, ast, false, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseAssignmentEvent = function (name, expression, sourceSpan, targetMatchableAttrs, targetEvents) {
        this._parseEvent(name + "Change", expression + "=$event", sourceSpan, targetMatchableAttrs, targetEvents);
    };
    TemplateParseVisitor.prototype._parseEvent = function (name, expression, sourceSpan, targetMatchableAttrs, targetEvents) {
        // long format: 'target: eventName'
        var parts = util_1.splitAtColon(name, [null, name]);
        var target = parts[0];
        var eventName = parts[1];
        var ast = this._parseAction(expression, sourceSpan);
        targetMatchableAttrs.push([name, ast.source]);
        targetEvents.push(new template_ast_1.BoundEventAst(eventName, target, ast, sourceSpan));
        // Don't detect directives for event names for now,
        // so don't add the event name to the matchableAttrs
    };
    TemplateParseVisitor.prototype._parseLiteralAttr = function (name, value, sourceSpan, targetProps) {
        targetProps.push(new BoundElementOrDirectiveProperty(name, this._exprParser.wrapLiteralPrimitive(value, ''), true, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseDirectives = function (selectorMatcher, elementCssSelector) {
        var _this = this;
        var directives = [];
        selectorMatcher.match(elementCssSelector, function (selector, directive) { directives.push(directive); });
        // Need to sort the directives so that we get consistent results throughout,
        // as selectorMatcher uses Maps inside.
        // Also need to make components the first directive in the array
        collection_1.ListWrapper.sort(directives, function (dir1, dir2) {
            var dir1Comp = dir1.isComponent;
            var dir2Comp = dir2.isComponent;
            if (dir1Comp && !dir2Comp) {
                return -1;
            }
            else if (!dir1Comp && dir2Comp) {
                return 1;
            }
            else {
                return _this.directivesIndex.get(dir1) - _this.directivesIndex.get(dir2);
            }
        });
        return directives;
    };
    TemplateParseVisitor.prototype._createDirectiveAsts = function (elementName, directives, props, possibleExportAsVars, sourceSpan) {
        var _this = this;
        var matchedVariables = new Set();
        var directiveAsts = directives.map(function (directive) {
            var hostProperties = [];
            var hostEvents = [];
            var directiveProperties = [];
            _this._createDirectiveHostPropertyAsts(elementName, directive.hostProperties, sourceSpan, hostProperties);
            _this._createDirectiveHostEventAsts(directive.hostListeners, sourceSpan, hostEvents);
            _this._createDirectivePropertyAsts(directive.inputs, props, directiveProperties);
            var exportAsVars = [];
            possibleExportAsVars.forEach(function (varAst) {
                if ((varAst.value.length === 0 && directive.isComponent) ||
                    (directive.exportAs == varAst.value)) {
                    exportAsVars.push(varAst);
                    matchedVariables.add(varAst.name);
                }
            });
            return new template_ast_1.DirectiveAst(directive, directiveProperties, hostProperties, hostEvents, exportAsVars, sourceSpan);
        });
        possibleExportAsVars.forEach(function (varAst) {
            if (varAst.value.length > 0 && !collection_1.SetWrapper.has(matchedVariables, varAst.name)) {
                _this._reportError("There is no directive with \"exportAs\" set to \"" + varAst.value + "\"", varAst.sourceSpan);
            }
        });
        return directiveAsts;
    };
    TemplateParseVisitor.prototype._createDirectiveHostPropertyAsts = function (elementName, hostProps, sourceSpan, targetPropertyAsts) {
        var _this = this;
        if (lang_1.isPresent(hostProps)) {
            collection_1.StringMapWrapper.forEach(hostProps, function (expression, propName) {
                var exprAst = _this._parseBinding(expression, sourceSpan);
                targetPropertyAsts.push(_this._createElementPropertyAst(elementName, propName, exprAst, sourceSpan));
            });
        }
    };
    TemplateParseVisitor.prototype._createDirectiveHostEventAsts = function (hostListeners, sourceSpan, targetEventAsts) {
        var _this = this;
        if (lang_1.isPresent(hostListeners)) {
            collection_1.StringMapWrapper.forEach(hostListeners, function (expression, propName) {
                _this._parseEvent(propName, expression, sourceSpan, [], targetEventAsts);
            });
        }
    };
    TemplateParseVisitor.prototype._createDirectivePropertyAsts = function (directiveProperties, boundProps, targetBoundDirectiveProps) {
        if (lang_1.isPresent(directiveProperties)) {
            var boundPropsByName = new Map();
            boundProps.forEach(function (boundProp) {
                var prevValue = boundPropsByName.get(boundProp.name);
                if (lang_1.isBlank(prevValue) || prevValue.isLiteral) {
                    // give [a]="b" a higher precedence than a="b" on the same element
                    boundPropsByName.set(boundProp.name, boundProp);
                }
            });
            collection_1.StringMapWrapper.forEach(directiveProperties, function (elProp, dirProp) {
                var boundProp = boundPropsByName.get(elProp);
                // Bindings are optional, so this binding only needs to be set up if an expression is given.
                if (lang_1.isPresent(boundProp)) {
                    targetBoundDirectiveProps.push(new template_ast_1.BoundDirectivePropertyAst(dirProp, boundProp.name, boundProp.expression, boundProp.sourceSpan));
                }
            });
        }
    };
    TemplateParseVisitor.prototype._createElementPropertyAsts = function (elementName, props, directives) {
        var _this = this;
        var boundElementProps = [];
        var boundDirectivePropsIndex = new Map();
        directives.forEach(function (directive) {
            directive.inputs.forEach(function (prop) {
                boundDirectivePropsIndex.set(prop.templateName, prop);
            });
        });
        props.forEach(function (prop) {
            if (!prop.isLiteral && lang_1.isBlank(boundDirectivePropsIndex.get(prop.name))) {
                boundElementProps.push(_this._createElementPropertyAst(elementName, prop.name, prop.expression, prop.sourceSpan));
            }
        });
        return boundElementProps;
    };
    TemplateParseVisitor.prototype._createElementPropertyAst = function (elementName, name, ast, sourceSpan) {
        var unit = null;
        var bindingType;
        var boundPropertyName;
        var parts = name.split(PROPERTY_PARTS_SEPARATOR);
        if (parts.length === 1) {
            boundPropertyName = this._schemaRegistry.getMappedPropName(parts[0]);
            bindingType = template_ast_1.PropertyBindingType.Property;
            if (!this._schemaRegistry.hasProperty(elementName, boundPropertyName)) {
                this._reportError("Can't bind to '" + boundPropertyName + "' since it isn't a known native property", sourceSpan);
            }
        }
        else {
            if (parts[0] == ATTRIBUTE_PREFIX) {
                boundPropertyName = parts[1];
                var nsSeparatorIdx = boundPropertyName.indexOf(':');
                if (nsSeparatorIdx > -1) {
                    var ns = boundPropertyName.substring(0, nsSeparatorIdx);
                    var name_1 = boundPropertyName.substring(nsSeparatorIdx + 1);
                    boundPropertyName = html_tags_1.mergeNsAndName(ns, name_1);
                }
                bindingType = template_ast_1.PropertyBindingType.Attribute;
            }
            else if (parts[0] == CLASS_PREFIX) {
                boundPropertyName = parts[1];
                bindingType = template_ast_1.PropertyBindingType.Class;
            }
            else if (parts[0] == STYLE_PREFIX) {
                unit = parts.length > 2 ? parts[2] : null;
                boundPropertyName = parts[1];
                bindingType = template_ast_1.PropertyBindingType.Style;
            }
            else {
                this._reportError("Invalid property name '" + name + "'", sourceSpan);
                bindingType = null;
            }
        }
        return new template_ast_1.BoundElementPropertyAst(boundPropertyName, bindingType, ast, unit, sourceSpan);
    };
    TemplateParseVisitor.prototype._findComponentDirectiveNames = function (directives) {
        var componentTypeNames = [];
        directives.forEach(function (directive) {
            var typeName = directive.directive.type.name;
            if (directive.directive.isComponent) {
                componentTypeNames.push(typeName);
            }
        });
        return componentTypeNames;
    };
    TemplateParseVisitor.prototype._assertOnlyOneComponent = function (directives, sourceSpan) {
        var componentTypeNames = this._findComponentDirectiveNames(directives);
        if (componentTypeNames.length > 1) {
            this._reportError("More than one component: " + componentTypeNames.join(','), sourceSpan);
        }
    };
    TemplateParseVisitor.prototype._assertNoComponentsNorElementBindingsOnTemplate = function (directives, elementProps, sourceSpan) {
        var _this = this;
        var componentTypeNames = this._findComponentDirectiveNames(directives);
        if (componentTypeNames.length > 0) {
            this._reportError("Components on an embedded template: " + componentTypeNames.join(','), sourceSpan);
        }
        elementProps.forEach(function (prop) {
            _this._reportError("Property binding " + prop.name + " not used by any directive on an embedded template", sourceSpan);
        });
    };
    TemplateParseVisitor.prototype._assertAllEventsPublishedByDirectives = function (directives, events) {
        var _this = this;
        var allDirectiveEvents = new Set();
        directives.forEach(function (directive) {
            collection_1.StringMapWrapper.forEach(directive.directive.outputs, function (eventName, _) {
                allDirectiveEvents.add(eventName);
            });
        });
        events.forEach(function (event) {
            if (lang_1.isPresent(event.target) || !collection_1.SetWrapper.has(allDirectiveEvents, event.name)) {
                _this._reportError("Event binding " + event.fullName + " not emitted by any directive on an embedded template", event.sourceSpan);
            }
        });
    };
    return TemplateParseVisitor;
})();
var NonBindableVisitor = (function () {
    function NonBindableVisitor() {
    }
    NonBindableVisitor.prototype.visitElement = function (ast, component) {
        var preparsedElement = template_preparser_1.preparseElement(ast);
        if (preparsedElement.type === template_preparser_1.PreparsedElementType.SCRIPT ||
            preparsedElement.type === template_preparser_1.PreparsedElementType.STYLE ||
            preparsedElement.type === template_preparser_1.PreparsedElementType.STYLESHEET) {
            // Skipping <script> for security reasons
            // Skipping <style> and stylesheets as we already processed them
            // in the StyleCompiler
            return null;
        }
        var attrNameAndValues = ast.attrs.map(function (attrAst) { return [attrAst.name, attrAst.value]; });
        var selector = createElementCssSelector(ast.name, attrNameAndValues);
        var ngContentIndex = component.findNgContentIndex(selector);
        var children = html_ast_1.htmlVisitAll(this, ast.children, EMPTY_COMPONENT);
        return new template_ast_1.ElementAst(ast.name, html_ast_1.htmlVisitAll(this, ast.attrs), [], [], [], [], children, ngContentIndex, ast.sourceSpan);
    };
    NonBindableVisitor.prototype.visitComment = function (ast, context) { return null; };
    NonBindableVisitor.prototype.visitAttr = function (ast, context) {
        return new template_ast_1.AttrAst(ast.name, ast.value, ast.sourceSpan);
    };
    NonBindableVisitor.prototype.visitText = function (ast, component) {
        var ngContentIndex = component.findNgContentIndex(TEXT_CSS_SELECTOR);
        return new template_ast_1.TextAst(ast.value, ngContentIndex, ast.sourceSpan);
    };
    return NonBindableVisitor;
})();
var BoundElementOrDirectiveProperty = (function () {
    function BoundElementOrDirectiveProperty(name, expression, isLiteral, sourceSpan) {
        this.name = name;
        this.expression = expression;
        this.isLiteral = isLiteral;
        this.sourceSpan = sourceSpan;
    }
    return BoundElementOrDirectiveProperty;
})();
function splitClasses(classAttrValue) {
    return lang_1.StringWrapper.split(classAttrValue.trim(), /\s+/g);
}
exports.splitClasses = splitClasses;
var Component = (function () {
    function Component(ngContentIndexMatcher, wildcardNgContentIndex) {
        this.ngContentIndexMatcher = ngContentIndexMatcher;
        this.wildcardNgContentIndex = wildcardNgContentIndex;
    }
    Component.create = function (directives) {
        if (directives.length === 0 || !directives[0].directive.isComponent) {
            return EMPTY_COMPONENT;
        }
        var matcher = new selector_1.SelectorMatcher();
        var ngContentSelectors = directives[0].directive.template.ngContentSelectors;
        var wildcardNgContentIndex = null;
        for (var i = 0; i < ngContentSelectors.length; i++) {
            var selector = ngContentSelectors[i];
            if (lang_1.StringWrapper.equals(selector, '*')) {
                wildcardNgContentIndex = i;
            }
            else {
                matcher.addSelectables(selector_1.CssSelector.parse(ngContentSelectors[i]), i);
            }
        }
        return new Component(matcher, wildcardNgContentIndex);
    };
    Component.prototype.findNgContentIndex = function (selector) {
        var ngContentIndices = [];
        this.ngContentIndexMatcher.match(selector, function (selector, ngContentIndex) { ngContentIndices.push(ngContentIndex); });
        collection_1.ListWrapper.sort(ngContentIndices);
        if (lang_1.isPresent(this.wildcardNgContentIndex)) {
            ngContentIndices.push(this.wildcardNgContentIndex);
        }
        return ngContentIndices.length > 0 ? ngContentIndices[0] : null;
    };
    return Component;
})();
function createElementCssSelector(elementName, matchableAttrs) {
    var cssSelector = new selector_1.CssSelector();
    var elNameNoNs = html_tags_1.splitNsName(elementName)[1];
    cssSelector.setElement(elNameNoNs);
    for (var i = 0; i < matchableAttrs.length; i++) {
        var attrName = matchableAttrs[i][0];
        var attrNameNoNs = html_tags_1.splitNsName(attrName)[1];
        var attrValue = matchableAttrs[i][1];
        cssSelector.addAttribute(attrNameNoNs, attrValue);
        if (attrName.toLowerCase() == CLASS_ATTR) {
            var classes = splitClasses(attrValue);
            classes.forEach(function (className) { return cssSelector.addClassName(className); });
        }
    }
    return cssSelector;
}
var EMPTY_COMPONENT = new Component(new selector_1.SelectorMatcher(), null);
var NON_BINDABLE_VISITOR = new NonBindableVisitor();
var PipeCollector = (function (_super) {
    __extends(PipeCollector, _super);
    function PipeCollector() {
        _super.apply(this, arguments);
        this.pipes = new Set();
    }
    PipeCollector.prototype.visitPipe = function (ast) {
        this.pipes.add(ast.name);
        ast.exp.visit(this);
        this.visitAll(ast.args);
        return null;
    };
    return PipeCollector;
})(ast_1.RecursiveAstVisitor);
exports.PipeCollector = PipeCollector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfcGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1Qdk91Ump2eC50bXAvYW5ndWxhcjIvc3JjL2NvbXBpbGVyL3RlbXBsYXRlX3BhcnNlci50cyJdLCJuYW1lcyI6WyJUZW1wbGF0ZVBhcnNlRXJyb3IiLCJUZW1wbGF0ZVBhcnNlRXJyb3IuY29uc3RydWN0b3IiLCJUZW1wbGF0ZVBhcnNlUmVzdWx0IiwiVGVtcGxhdGVQYXJzZVJlc3VsdC5jb25zdHJ1Y3RvciIsIlRlbXBsYXRlUGFyc2VyIiwiVGVtcGxhdGVQYXJzZXIuY29uc3RydWN0b3IiLCJUZW1wbGF0ZVBhcnNlci5wYXJzZSIsIlRlbXBsYXRlUGFyc2VyLnRyeVBhcnNlIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5jb25zdHJ1Y3RvciIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9yZXBvcnRFcnJvciIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9wYXJzZUludGVycG9sYXRpb24iLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fcGFyc2VBY3Rpb24iLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fcGFyc2VCaW5kaW5nIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX3BhcnNlVGVtcGxhdGVCaW5kaW5ncyIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9jaGVja1BpcGVzIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IudmlzaXRUZXh0IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IudmlzaXRBdHRyIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IudmlzaXRDb21tZW50IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IudmlzaXRFbGVtZW50IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX3BhcnNlSW5saW5lVGVtcGxhdGVCaW5kaW5nIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX3BhcnNlQXR0ciIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9ub3JtYWxpemVBdHRyaWJ1dGVOYW1lIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX3BhcnNlVmFyaWFibGUiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fcGFyc2VQcm9wZXJ0eSIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9wYXJzZVByb3BlcnR5SW50ZXJwb2xhdGlvbiIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9wYXJzZVByb3BlcnR5QXN0IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX3BhcnNlQXNzaWdubWVudEV2ZW50IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX3BhcnNlRXZlbnQiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fcGFyc2VMaXRlcmFsQXR0ciIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9wYXJzZURpcmVjdGl2ZXMiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fY3JlYXRlRGlyZWN0aXZlQXN0cyIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9jcmVhdGVEaXJlY3RpdmVIb3N0UHJvcGVydHlBc3RzIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX2NyZWF0ZURpcmVjdGl2ZUhvc3RFdmVudEFzdHMiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fY3JlYXRlRGlyZWN0aXZlUHJvcGVydHlBc3RzIiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX2NyZWF0ZUVsZW1lbnRQcm9wZXJ0eUFzdHMiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fY3JlYXRlRWxlbWVudFByb3BlcnR5QXN0IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX2ZpbmRDb21wb25lbnREaXJlY3RpdmVOYW1lcyIsIlRlbXBsYXRlUGFyc2VWaXNpdG9yLl9hc3NlcnRPbmx5T25lQ29tcG9uZW50IiwiVGVtcGxhdGVQYXJzZVZpc2l0b3IuX2Fzc2VydE5vQ29tcG9uZW50c05vckVsZW1lbnRCaW5kaW5nc09uVGVtcGxhdGUiLCJUZW1wbGF0ZVBhcnNlVmlzaXRvci5fYXNzZXJ0QWxsRXZlbnRzUHVibGlzaGVkQnlEaXJlY3RpdmVzIiwiTm9uQmluZGFibGVWaXNpdG9yIiwiTm9uQmluZGFibGVWaXNpdG9yLmNvbnN0cnVjdG9yIiwiTm9uQmluZGFibGVWaXNpdG9yLnZpc2l0RWxlbWVudCIsIk5vbkJpbmRhYmxlVmlzaXRvci52aXNpdENvbW1lbnQiLCJOb25CaW5kYWJsZVZpc2l0b3IudmlzaXRBdHRyIiwiTm9uQmluZGFibGVWaXNpdG9yLnZpc2l0VGV4dCIsIkJvdW5kRWxlbWVudE9yRGlyZWN0aXZlUHJvcGVydHkiLCJCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5LmNvbnN0cnVjdG9yIiwic3BsaXRDbGFzc2VzIiwiQ29tcG9uZW50IiwiQ29tcG9uZW50LmNvbnN0cnVjdG9yIiwiQ29tcG9uZW50LmNyZWF0ZSIsIkNvbXBvbmVudC5maW5kTmdDb250ZW50SW5kZXgiLCJjcmVhdGVFbGVtZW50Q3NzU2VsZWN0b3IiLCJQaXBlQ29sbGVjdG9yIiwiUGlwZUNvbGxlY3Rvci5jb25zdHJ1Y3RvciIsIlBpcGVDb2xsZWN0b3IudmlzaXRQaXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUF3RCxnQ0FBZ0MsQ0FBQyxDQUFBO0FBQ3pGLHFCQUErRCwwQkFBMEIsQ0FBQyxDQUFBO0FBQzFGLHFCQUF3RCxlQUFlLENBQUMsQ0FBQTtBQUN4RSxxQkFBeUIsMEJBQTBCLENBQUMsQ0FBQTtBQUNwRCwyQkFBNEIsZ0NBQWdDLENBQUMsQ0FBQTtBQUM3RCxpQ0FBeUMscURBQXFELENBQUMsQ0FBQTtBQUcvRiw0QkFBeUIsZUFBZSxDQUFDLENBQUE7QUFDekMsMEJBQTBDLGFBQWEsQ0FBQyxDQUFBO0FBQ3hELDJCQUF5RCxjQUFjLENBQUMsQ0FBQTtBQUN4RSxvQkFBK0MsK0NBQStDLENBQUMsQ0FBQTtBQUUvRiw2QkFBa1EsZ0JBQWdCLENBQUMsQ0FBQTtBQUNuUix5QkFBMkMsZ0NBQWdDLENBQUMsQ0FBQTtBQUU1RSx3Q0FBb0Msc0RBQXNELENBQUMsQ0FBQTtBQUMzRixtQ0FBc0Usc0JBQXNCLENBQUMsQ0FB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QUFLQSxDQUFDQTtRQUN2QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3pCQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNsQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM1QkEsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FDZkEsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsVUFBVUEsRUFBRUEsb0JBQW9CQSxFQUFFQSxXQUFXQSxDQUFDQSxDQUFDQTtZQUVuRkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQVNBLENBQ0xBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3QkEsSUFBSUEsVUFBVUEsR0FBR0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzlCQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxVQUFVQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxVQUFVQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUUxRUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNuQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FDWkEsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsVUFBVUEsRUFBRUEsb0JBQW9CQSxFQUFFQSxZQUFZQSxDQUFDQSxDQUFDQTtZQUVwRkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQVNBLENBQUNBLFNBQVNBLENB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QUlBLEdBQUdBLEVBQVVBLENBQUNBO0lBT3pDQSxDQUFDQTtJQU5DRCxpQ0FBU0EsR0FBVEEsVUFBVUEsR0FBZ0JBO1FBQ3hCRSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN6QkEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDcEJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3hCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUNIRixvQkFBQ0E7QUFBREEsQ0FBQ0EsQUFSRCxFQUFtQyx5QkFBbUIsRUFRckQ7QUFSWSxxQkFBYSxnQkFRekIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TGlzdFdyYXBwZXIsIFN0cmluZ01hcFdyYXBwZXIsIFNldFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5pbXBvcnQge1JlZ0V4cFdyYXBwZXIsIGlzUHJlc2VudCwgU3RyaW5nV3JhcHBlciwgaXNCbGFua30gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgSW5qZWN0LCBPcGFxdWVUb2tlbiwgT3B0aW9uYWx9IGZyb20gJ2FuZ3VsYXIyL2NvcmUnO1xuaW1wb3J0IHtDT05TVF9FWFBSfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuaW1wb3J0IHtCYXNlRXhjZXB0aW9ufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2V4Y2VwdGlvbnMnO1xuaW1wb3J0IHtQYXJzZXIsIEFTVCwgQVNUV2l0aFNvdXJjZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7VGVtcGxhdGVCaW5kaW5nfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9jaGFuZ2VfZGV0ZWN0aW9uL3BhcnNlci9hc3QnO1xuaW1wb3J0IHtDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIENvbXBpbGVQaXBlTWV0YWRhdGF9IGZyb20gJy4vZGlyZWN0aXZlX21ldGFkYXRhJztcbmltcG9ydCB7SHRtbFBhcnNlcn0gZnJvbSAnLi9odG1sX3BhcnNlcic7XG5pbXBvcnQge3NwbGl0TnNOYW1lLCBtZXJnZU5zQW5kTmFtZX0gZnJvbSAnLi9odG1sX3RhZ3MnO1xuaW1wb3J0IHtQYXJzZVNvdXJjZVNwYW4sIFBhcnNlRXJyb3IsIFBhcnNlTG9jYXRpb259IGZyb20gJy4vcGFyc2VfdXRpbCc7XG5pbXBvcnQge1JlY3Vyc2l2ZUFzdFZpc2l0b3IsIEJpbmRpbmdQaXBlfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9jaGFuZ2VfZGV0ZWN0aW9uL3BhcnNlci9hc3QnO1xuXG5pbXBvcnQge0VsZW1lbnRBc3QsIEJvdW5kRWxlbWVudFByb3BlcnR5QXN0LCBCb3VuZEV2ZW50QXN0LCBWYXJpYWJsZUFzdCwgVGVtcGxhdGVBc3QsIFRlbXBsYXRlQXN0VmlzaXRvciwgdGVtcGxhdGVWaXNpdEFsbCwgVGV4dEFzdCwgQm91bmRUZXh0QXN0LCBFbWJlZGRlZFRlbXBsYXRlQXN0LCBBdHRyQXN0LCBOZ0NvbnRlbnRBc3QsIFByb3BlcnR5QmluZGluZ1R5cGUsIERpcmVjdGl2ZUFzdCwgQm91bmREaXJlY3RpdmVQcm9wZXJ0eUFzdH0gZnJvbSAnLi90ZW1wbGF0ZV9hc3QnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgU2VsZWN0b3JNYXRjaGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvY29tcGlsZXIvc2VsZWN0b3InO1xuXG5pbXBvcnQge0VsZW1lbnRTY2hlbWFSZWdpc3RyeX0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvbXBpbGVyL3NjaGVtYS9lbGVtZW50X3NjaGVtYV9yZWdpc3RyeSc7XG5pbXBvcnQge3ByZXBhcnNlRWxlbWVudCwgUHJlcGFyc2VkRWxlbWVudCwgUHJlcGFyc2VkRWxlbWVudFR5cGV9IGZyb20gJy4vdGVtcGxhdGVfcHJlcGFyc2VyJztcblxuaW1wb3J0IHtpc1N0eWxlVXJsUmVzb2x2YWJsZX0gZnJvbSAnLi9zdHlsZV91cmxfcmVzb2x2ZXInO1xuXG5pbXBvcnQge0h0bWxBc3RWaXNpdG9yLCBIdG1sQXN0LCBIdG1sRWxlbWVudEFzdCwgSHRtbEF0dHJBc3QsIEh0bWxUZXh0QXN0LCBIdG1sQ29tbWVudEFzdCwgaHRtbFZpc2l0QWxsfSBmcm9tICcuL2h0bWxfYXN0JztcblxuaW1wb3J0IHtzcGxpdEF0Q29sb259IGZyb20gJy4vdXRpbCc7XG5cbi8vIEdyb3VwIDEgPSBcImJpbmQtXCJcbi8vIEdyb3VwIDIgPSBcInZhci1cIiBvciBcIiNcIlxuLy8gR3JvdXAgMyA9IFwib24tXCJcbi8vIEdyb3VwIDQgPSBcImJpbmRvbi1cIlxuLy8gR3JvdXAgNSA9IHRoZSBpZGVudGlmaWVyIGFmdGVyIFwiYmluZC1cIiwgXCJ2YXItLyNcIiwgb3IgXCJvbi1cIlxuLy8gR3JvdXAgNiA9IGlkZW50aWZpZXIgaW5zaWRlIFsoKV1cbi8vIEdyb3VwIDcgPSBpZGVudGlmaWVyIGluc2lkZSBbXVxuLy8gR3JvdXAgOCA9IGlkZW50aWZpZXIgaW5zaWRlICgpXG52YXIgQklORF9OQU1FX1JFR0VYUCA9XG4gICAgL14oPzooPzooPzooYmluZC0pfCh2YXItfCMpfChvbi0pfChiaW5kb24tKSkoLispKXxcXFtcXCgoW15cXCldKylcXClcXF18XFxbKFteXFxdXSspXFxdfFxcKChbXlxcKV0rKVxcKSkkL2c7XG5cbmNvbnN0IFRFTVBMQVRFX0VMRU1FTlQgPSAndGVtcGxhdGUnO1xuY29uc3QgVEVNUExBVEVfQVRUUiA9ICd0ZW1wbGF0ZSc7XG5jb25zdCBURU1QTEFURV9BVFRSX1BSRUZJWCA9ICcqJztcbmNvbnN0IENMQVNTX0FUVFIgPSAnY2xhc3MnO1xuXG52YXIgUFJPUEVSVFlfUEFSVFNfU0VQQVJBVE9SID0gJy4nO1xuY29uc3QgQVRUUklCVVRFX1BSRUZJWCA9ICdhdHRyJztcbmNvbnN0IENMQVNTX1BSRUZJWCA9ICdjbGFzcyc7XG5jb25zdCBTVFlMRV9QUkVGSVggPSAnc3R5bGUnO1xuXG52YXIgVEVYVF9DU1NfU0VMRUNUT1IgPSBDc3NTZWxlY3Rvci5wYXJzZSgnKicpWzBdO1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGFycmF5IG9mIHtAbGluayBUZW1wbGF0ZUFzdFZpc2l0b3J9cyB3aGljaCB3aWxsIGJlIHVzZWQgdG8gdHJhbnNmb3JtXG4gKiBwYXJzZWQgdGVtcGxhdGVzIGJlZm9yZSBjb21waWxhdGlvbiBpcyBpbnZva2VkLCBhbGxvd2luZyBjdXN0b20gZXhwcmVzc2lvbiBzeW50YXhcbiAqIGFuZCBvdGhlciBhZHZhbmNlZCB0cmFuc2Zvcm1hdGlvbnMuXG4gKlxuICogVGhpcyBpcyBjdXJyZW50bHkgYW4gaW50ZXJuYWwtb25seSBmZWF0dXJlIGFuZCBub3QgbWVhbnQgZm9yIGdlbmVyYWwgdXNlLlxuICovXG5leHBvcnQgY29uc3QgVEVNUExBVEVfVFJBTlNGT1JNUyA9IENPTlNUX0VYUFIobmV3IE9wYXF1ZVRva2VuKCdUZW1wbGF0ZVRyYW5zZm9ybXMnKSk7XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBhcnNlRXJyb3IgZXh0ZW5kcyBQYXJzZUVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBzcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHsgc3VwZXIoc3BhbiwgbWVzc2FnZSk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUGFyc2VSZXN1bHQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdGVtcGxhdGVBc3Q/OiBUZW1wbGF0ZUFzdFtdLCBwdWJsaWMgZXJyb3JzPzogUGFyc2VFcnJvcltdKSB7fVxufVxuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQYXJzZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2V4cHJQYXJzZXI6IFBhcnNlciwgcHJpdmF0ZSBfc2NoZW1hUmVnaXN0cnk6IEVsZW1lbnRTY2hlbWFSZWdpc3RyeSxcbiAgICAgIHByaXZhdGUgX2h0bWxQYXJzZXI6IEh0bWxQYXJzZXIsXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KFRFTVBMQVRFX1RSQU5TRk9STVMpIHB1YmxpYyB0cmFuc2Zvcm1zOiBUZW1wbGF0ZUFzdFZpc2l0b3JbXSkge31cblxuICBwYXJzZShcbiAgICAgIHRlbXBsYXRlOiBzdHJpbmcsIGRpcmVjdGl2ZXM6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YVtdLCBwaXBlczogQ29tcGlsZVBpcGVNZXRhZGF0YVtdLFxuICAgICAgdGVtcGxhdGVVcmw6IHN0cmluZyk6IFRlbXBsYXRlQXN0W10ge1xuICAgIHZhciByZXN1bHQgPSB0aGlzLnRyeVBhcnNlKHRlbXBsYXRlLCBkaXJlY3RpdmVzLCBwaXBlcywgdGVtcGxhdGVVcmwpO1xuICAgIGlmIChpc1ByZXNlbnQocmVzdWx0LmVycm9ycykpIHtcbiAgICAgIHZhciBlcnJvclN0cmluZyA9IHJlc3VsdC5lcnJvcnMuam9pbignXFxuJyk7XG4gICAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgVGVtcGxhdGUgcGFyc2UgZXJyb3JzOlxcbiR7ZXJyb3JTdHJpbmd9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudGVtcGxhdGVBc3Q7XG4gIH1cblxuICB0cnlQYXJzZShcbiAgICAgIHRlbXBsYXRlOiBzdHJpbmcsIGRpcmVjdGl2ZXM6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YVtdLCBwaXBlczogQ29tcGlsZVBpcGVNZXRhZGF0YVtdLFxuICAgICAgdGVtcGxhdGVVcmw6IHN0cmluZyk6IFRlbXBsYXRlUGFyc2VSZXN1bHQge1xuICAgIHZhciBwYXJzZVZpc2l0b3IgPVxuICAgICAgICBuZXcgVGVtcGxhdGVQYXJzZVZpc2l0b3IoZGlyZWN0aXZlcywgcGlwZXMsIHRoaXMuX2V4cHJQYXJzZXIsIHRoaXMuX3NjaGVtYVJlZ2lzdHJ5KTtcbiAgICB2YXIgaHRtbEFzdFdpdGhFcnJvcnMgPSB0aGlzLl9odG1sUGFyc2VyLnBhcnNlKHRlbXBsYXRlLCB0ZW1wbGF0ZVVybCk7XG4gICAgdmFyIHJlc3VsdCA9IGh0bWxWaXNpdEFsbChwYXJzZVZpc2l0b3IsIGh0bWxBc3RXaXRoRXJyb3JzLnJvb3ROb2RlcywgRU1QVFlfQ09NUE9ORU5UKTtcbiAgICB2YXIgZXJyb3JzOiBQYXJzZUVycm9yW10gPSBodG1sQXN0V2l0aEVycm9ycy5lcnJvcnMuY29uY2F0KHBhcnNlVmlzaXRvci5lcnJvcnMpO1xuICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIG5ldyBUZW1wbGF0ZVBhcnNlUmVzdWx0KHJlc3VsdCwgZXJyb3JzKTtcbiAgICB9XG4gICAgaWYgKGlzUHJlc2VudCh0aGlzLnRyYW5zZm9ybXMpKSB7XG4gICAgICB0aGlzLnRyYW5zZm9ybXMuZm9yRWFjaChcbiAgICAgICAgICAodHJhbnNmb3JtOiBUZW1wbGF0ZUFzdFZpc2l0b3IpID0+IHsgcmVzdWx0ID0gdGVtcGxhdGVWaXNpdEFsbCh0cmFuc2Zvcm0sIHJlc3VsdCk7IH0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRlbXBsYXRlUGFyc2VSZXN1bHQocmVzdWx0KTtcbiAgfVxufVxuXG5jbGFzcyBUZW1wbGF0ZVBhcnNlVmlzaXRvciBpbXBsZW1lbnRzIEh0bWxBc3RWaXNpdG9yIHtcbiAgc2VsZWN0b3JNYXRjaGVyOiBTZWxlY3Rvck1hdGNoZXI7XG4gIGVycm9yczogVGVtcGxhdGVQYXJzZUVycm9yW10gPSBbXTtcbiAgZGlyZWN0aXZlc0luZGV4ID0gbmV3IE1hcDxDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsIG51bWJlcj4oKTtcbiAgbmdDb250ZW50Q291bnQ6IG51bWJlciA9IDA7XG4gIHBpcGVzQnlOYW1lOiBNYXA8c3RyaW5nLCBDb21waWxlUGlwZU1ldGFkYXRhPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGRpcmVjdGl2ZXM6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YVtdLCBwaXBlczogQ29tcGlsZVBpcGVNZXRhZGF0YVtdLFxuICAgICAgcHJpdmF0ZSBfZXhwclBhcnNlcjogUGFyc2VyLCBwcml2YXRlIF9zY2hlbWFSZWdpc3RyeTogRWxlbWVudFNjaGVtYVJlZ2lzdHJ5KSB7XG4gICAgdGhpcy5zZWxlY3Rvck1hdGNoZXIgPSBuZXcgU2VsZWN0b3JNYXRjaGVyKCk7XG4gICAgTGlzdFdyYXBwZXIuZm9yRWFjaFdpdGhJbmRleChcbiAgICAgICAgZGlyZWN0aXZlcywgKGRpcmVjdGl2ZTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgdmFyIHNlbGVjdG9yID0gQ3NzU2VsZWN0b3IucGFyc2UoZGlyZWN0aXZlLnNlbGVjdG9yKTtcbiAgICAgICAgICB0aGlzLnNlbGVjdG9yTWF0Y2hlci5hZGRTZWxlY3RhYmxlcyhzZWxlY3RvciwgZGlyZWN0aXZlKTtcbiAgICAgICAgICB0aGlzLmRpcmVjdGl2ZXNJbmRleC5zZXQoZGlyZWN0aXZlLCBpbmRleCk7XG4gICAgICAgIH0pO1xuICAgIHRoaXMucGlwZXNCeU5hbWUgPSBuZXcgTWFwPHN0cmluZywgQ29tcGlsZVBpcGVNZXRhZGF0YT4oKTtcbiAgICBwaXBlcy5mb3JFYWNoKHBpcGUgPT4gdGhpcy5waXBlc0J5TmFtZS5zZXQocGlwZS5uYW1lLCBwaXBlKSk7XG4gIH1cblxuICBwcml2YXRlIF9yZXBvcnRFcnJvcihtZXNzYWdlOiBzdHJpbmcsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge1xuICAgIHRoaXMuZXJyb3JzLnB1c2gobmV3IFRlbXBsYXRlUGFyc2VFcnJvcihtZXNzYWdlLCBzb3VyY2VTcGFuKSk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZUludGVycG9sYXRpb24odmFsdWU6IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKTogQVNUV2l0aFNvdXJjZSB7XG4gICAgdmFyIHNvdXJjZUluZm8gPSBzb3VyY2VTcGFuLnN0YXJ0LnRvU3RyaW5nKCk7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBhc3QgPSB0aGlzLl9leHByUGFyc2VyLnBhcnNlSW50ZXJwb2xhdGlvbih2YWx1ZSwgc291cmNlSW5mbyk7XG4gICAgICB0aGlzLl9jaGVja1BpcGVzKGFzdCwgc291cmNlU3Bhbik7XG4gICAgICByZXR1cm4gYXN0O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKGAke2V9YCwgc291cmNlU3Bhbik7XG4gICAgICByZXR1cm4gdGhpcy5fZXhwclBhcnNlci53cmFwTGl0ZXJhbFByaW1pdGl2ZSgnRVJST1InLCBzb3VyY2VJbmZvKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZUFjdGlvbih2YWx1ZTogc3RyaW5nLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pOiBBU1RXaXRoU291cmNlIHtcbiAgICB2YXIgc291cmNlSW5mbyA9IHNvdXJjZVNwYW4uc3RhcnQudG9TdHJpbmcoKTtcbiAgICB0cnkge1xuICAgICAgdmFyIGFzdCA9IHRoaXMuX2V4cHJQYXJzZXIucGFyc2VBY3Rpb24odmFsdWUsIHNvdXJjZUluZm8pO1xuICAgICAgdGhpcy5fY2hlY2tQaXBlcyhhc3QsIHNvdXJjZVNwYW4pO1xuICAgICAgcmV0dXJuIGFzdDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihgJHtlfWAsIHNvdXJjZVNwYW4pO1xuICAgICAgcmV0dXJuIHRoaXMuX2V4cHJQYXJzZXIud3JhcExpdGVyYWxQcmltaXRpdmUoJ0VSUk9SJywgc291cmNlSW5mbyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VCaW5kaW5nKHZhbHVlOiBzdHJpbmcsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbik6IEFTVFdpdGhTb3VyY2Uge1xuICAgIHZhciBzb3VyY2VJbmZvID0gc291cmNlU3Bhbi5zdGFydC50b1N0cmluZygpO1xuICAgIHRyeSB7XG4gICAgICB2YXIgYXN0ID0gdGhpcy5fZXhwclBhcnNlci5wYXJzZUJpbmRpbmcodmFsdWUsIHNvdXJjZUluZm8pO1xuICAgICAgdGhpcy5fY2hlY2tQaXBlcyhhc3QsIHNvdXJjZVNwYW4pO1xuICAgICAgcmV0dXJuIGFzdDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihgJHtlfWAsIHNvdXJjZVNwYW4pO1xuICAgICAgcmV0dXJuIHRoaXMuX2V4cHJQYXJzZXIud3JhcExpdGVyYWxQcmltaXRpdmUoJ0VSUk9SJywgc291cmNlSW5mbyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VUZW1wbGF0ZUJpbmRpbmdzKHZhbHVlOiBzdHJpbmcsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbik6IFRlbXBsYXRlQmluZGluZ1tdIHtcbiAgICB2YXIgc291cmNlSW5mbyA9IHNvdXJjZVNwYW4uc3RhcnQudG9TdHJpbmcoKTtcbiAgICB0cnkge1xuICAgICAgdmFyIGJpbmRpbmdzID0gdGhpcy5fZXhwclBhcnNlci5wYXJzZVRlbXBsYXRlQmluZGluZ3ModmFsdWUsIHNvdXJjZUluZm8pO1xuICAgICAgYmluZGluZ3MuZm9yRWFjaCgoYmluZGluZykgPT4ge1xuICAgICAgICBpZiAoaXNQcmVzZW50KGJpbmRpbmcuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICB0aGlzLl9jaGVja1BpcGVzKGJpbmRpbmcuZXhwcmVzc2lvbiwgc291cmNlU3Bhbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGJpbmRpbmdzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKGAke2V9YCwgc291cmNlU3Bhbik7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2hlY2tQaXBlcyhhc3Q6IEFTVFdpdGhTb3VyY2UsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge1xuICAgIGlmIChpc1ByZXNlbnQoYXN0KSkge1xuICAgICAgdmFyIGNvbGxlY3RvciA9IG5ldyBQaXBlQ29sbGVjdG9yKCk7XG4gICAgICBhc3QudmlzaXQoY29sbGVjdG9yKTtcbiAgICAgIGNvbGxlY3Rvci5waXBlcy5mb3JFYWNoKChwaXBlTmFtZSkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMucGlwZXNCeU5hbWUuaGFzKHBpcGVOYW1lKSkge1xuICAgICAgICAgIHRoaXMuX3JlcG9ydEVycm9yKGBUaGUgcGlwZSAnJHtwaXBlTmFtZX0nIGNvdWxkIG5vdCBiZSBmb3VuZGAsIHNvdXJjZVNwYW4pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB2aXNpdFRleHQoYXN0OiBIdG1sVGV4dEFzdCwgY29tcG9uZW50OiBDb21wb25lbnQpOiBhbnkge1xuICAgIHZhciBuZ0NvbnRlbnRJbmRleCA9IGNvbXBvbmVudC5maW5kTmdDb250ZW50SW5kZXgoVEVYVF9DU1NfU0VMRUNUT1IpO1xuICAgIHZhciBleHByID0gdGhpcy5fcGFyc2VJbnRlcnBvbGF0aW9uKGFzdC52YWx1ZSwgYXN0LnNvdXJjZVNwYW4pO1xuICAgIGlmIChpc1ByZXNlbnQoZXhwcikpIHtcbiAgICAgIHJldHVybiBuZXcgQm91bmRUZXh0QXN0KGV4cHIsIG5nQ29udGVudEluZGV4LCBhc3Quc291cmNlU3Bhbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgVGV4dEFzdChhc3QudmFsdWUsIG5nQ29udGVudEluZGV4LCBhc3Quc291cmNlU3Bhbik7XG4gICAgfVxuICB9XG5cbiAgdmlzaXRBdHRyKGFzdDogSHRtbEF0dHJBc3QsIGNvbnRleDogYW55KTogYW55IHtcbiAgICByZXR1cm4gbmV3IEF0dHJBc3QoYXN0Lm5hbWUsIGFzdC52YWx1ZSwgYXN0LnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgdmlzaXRDb21tZW50KGFzdDogSHRtbENvbW1lbnRBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7IHJldHVybiBudWxsOyB9XG5cbiAgdmlzaXRFbGVtZW50KGVsZW1lbnQ6IEh0bWxFbGVtZW50QXN0LCBjb21wb25lbnQ6IENvbXBvbmVudCk6IGFueSB7XG4gICAgdmFyIG5vZGVOYW1lID0gZWxlbWVudC5uYW1lO1xuICAgIHZhciBwcmVwYXJzZWRFbGVtZW50ID0gcHJlcGFyc2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNDUklQVCB8fFxuICAgICAgICBwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFKSB7XG4gICAgICAvLyBTa2lwcGluZyA8c2NyaXB0PiBmb3Igc2VjdXJpdHkgcmVhc29uc1xuICAgICAgLy8gU2tpcHBpbmcgPHN0eWxlPiBhcyB3ZSBhbHJlYWR5IHByb2Nlc3NlZCB0aGVtXG4gICAgICAvLyBpbiB0aGUgU3R5bGVDb21waWxlclxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFU0hFRVQgJiZcbiAgICAgICAgaXNTdHlsZVVybFJlc29sdmFibGUocHJlcGFyc2VkRWxlbWVudC5ocmVmQXR0cikpIHtcbiAgICAgIC8vIFNraXBwaW5nIHN0eWxlc2hlZXRzIHdpdGggZWl0aGVyIHJlbGF0aXZlIHVybHMgb3IgcGFja2FnZSBzY2hlbWUgYXMgd2UgYWxyZWFkeSBwcm9jZXNzZWRcbiAgICAgIC8vIHRoZW0gaW4gdGhlIFN0eWxlQ29tcGlsZXJcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBtYXRjaGFibGVBdHRyczogc3RyaW5nW11bXSA9IFtdO1xuICAgIHZhciBlbGVtZW50T3JEaXJlY3RpdmVQcm9wczogQm91bmRFbGVtZW50T3JEaXJlY3RpdmVQcm9wZXJ0eVtdID0gW107XG4gICAgdmFyIHZhcnM6IFZhcmlhYmxlQXN0W10gPSBbXTtcbiAgICB2YXIgZXZlbnRzOiBCb3VuZEV2ZW50QXN0W10gPSBbXTtcblxuICAgIHZhciB0ZW1wbGF0ZUVsZW1lbnRPckRpcmVjdGl2ZVByb3BzOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5W10gPSBbXTtcbiAgICB2YXIgdGVtcGxhdGVWYXJzOiBWYXJpYWJsZUFzdFtdID0gW107XG4gICAgdmFyIHRlbXBsYXRlTWF0Y2hhYmxlQXR0cnM6IHN0cmluZ1tdW10gPSBbXTtcbiAgICB2YXIgaGFzSW5saW5lVGVtcGxhdGVzID0gZmFsc2U7XG4gICAgdmFyIGF0dHJzID0gW107XG5cbiAgICBlbGVtZW50LmF0dHJzLmZvckVhY2goYXR0ciA9PiB7XG4gICAgICB2YXIgaGFzQmluZGluZyA9IHRoaXMuX3BhcnNlQXR0cihhdHRyLCBtYXRjaGFibGVBdHRycywgZWxlbWVudE9yRGlyZWN0aXZlUHJvcHMsIGV2ZW50cywgdmFycyk7XG4gICAgICB2YXIgaGFzVGVtcGxhdGVCaW5kaW5nID0gdGhpcy5fcGFyc2VJbmxpbmVUZW1wbGF0ZUJpbmRpbmcoXG4gICAgICAgICAgYXR0ciwgdGVtcGxhdGVNYXRjaGFibGVBdHRycywgdGVtcGxhdGVFbGVtZW50T3JEaXJlY3RpdmVQcm9wcywgdGVtcGxhdGVWYXJzKTtcbiAgICAgIGlmICghaGFzQmluZGluZyAmJiAhaGFzVGVtcGxhdGVCaW5kaW5nKSB7XG4gICAgICAgIC8vIGRvbid0IGluY2x1ZGUgdGhlIGJpbmRpbmdzIGFzIGF0dHJpYnV0ZXMgYXMgd2VsbCBpbiB0aGUgQVNUXG4gICAgICAgIGF0dHJzLnB1c2godGhpcy52aXNpdEF0dHIoYXR0ciwgbnVsbCkpO1xuICAgICAgICBtYXRjaGFibGVBdHRycy5wdXNoKFthdHRyLm5hbWUsIGF0dHIudmFsdWVdKTtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNUZW1wbGF0ZUJpbmRpbmcpIHtcbiAgICAgICAgaGFzSW5saW5lVGVtcGxhdGVzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBsY0VsTmFtZSA9IHNwbGl0TnNOYW1lKG5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpWzFdO1xuICAgIHZhciBpc1RlbXBsYXRlRWxlbWVudCA9IGxjRWxOYW1lID09IFRFTVBMQVRFX0VMRU1FTlQ7XG4gICAgdmFyIGVsZW1lbnRDc3NTZWxlY3RvciA9IGNyZWF0ZUVsZW1lbnRDc3NTZWxlY3Rvcihub2RlTmFtZSwgbWF0Y2hhYmxlQXR0cnMpO1xuICAgIHZhciBkaXJlY3RpdmVzID0gdGhpcy5fY3JlYXRlRGlyZWN0aXZlQXN0cyhcbiAgICAgICAgZWxlbWVudC5uYW1lLCB0aGlzLl9wYXJzZURpcmVjdGl2ZXModGhpcy5zZWxlY3Rvck1hdGNoZXIsIGVsZW1lbnRDc3NTZWxlY3RvciksXG4gICAgICAgIGVsZW1lbnRPckRpcmVjdGl2ZVByb3BzLCBpc1RlbXBsYXRlRWxlbWVudCA/IFtdIDogdmFycywgZWxlbWVudC5zb3VyY2VTcGFuKTtcbiAgICB2YXIgZWxlbWVudFByb3BzOiBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdFtdID1cbiAgICAgICAgdGhpcy5fY3JlYXRlRWxlbWVudFByb3BlcnR5QXN0cyhlbGVtZW50Lm5hbWUsIGVsZW1lbnRPckRpcmVjdGl2ZVByb3BzLCBkaXJlY3RpdmVzKTtcbiAgICB2YXIgY2hpbGRyZW4gPSBodG1sVmlzaXRBbGwoXG4gICAgICAgIHByZXBhcnNlZEVsZW1lbnQubm9uQmluZGFibGUgPyBOT05fQklOREFCTEVfVklTSVRPUiA6IHRoaXMsIGVsZW1lbnQuY2hpbGRyZW4sXG4gICAgICAgIENvbXBvbmVudC5jcmVhdGUoZGlyZWN0aXZlcykpO1xuXG4gICAgLy8gT3ZlcnJpZGUgdGhlIGFjdHVhbCBzZWxlY3RvciB3aGVuIHRoZSBgbmdQcm9qZWN0QXNgIGF0dHJpYnV0ZSBpcyBwcm92aWRlZFxuICAgIHZhciBwcm9qZWN0aW9uU2VsZWN0b3IgPSBpc1ByZXNlbnQocHJlcGFyc2VkRWxlbWVudC5wcm9qZWN0QXMpID9cbiAgICAgICAgQ3NzU2VsZWN0b3IucGFyc2UocHJlcGFyc2VkRWxlbWVudC5wcm9qZWN0QXMpWzBdIDpcbiAgICAgICAgZWxlbWVudENzc1NlbGVjdG9yO1xuICAgIHZhciBuZ0NvbnRlbnRJbmRleCA9IGNvbXBvbmVudC5maW5kTmdDb250ZW50SW5kZXgocHJvamVjdGlvblNlbGVjdG9yKTtcbiAgICB2YXIgcGFyc2VkRWxlbWVudDtcblxuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLk5HX0NPTlRFTlQpIHtcbiAgICAgIGlmIChpc1ByZXNlbnQoZWxlbWVudC5jaGlsZHJlbikgJiYgZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgICAgYDxuZy1jb250ZW50PiBlbGVtZW50IGNhbm5vdCBoYXZlIGNvbnRlbnQuIDxuZy1jb250ZW50PiBtdXN0IGJlIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IDwvbmctY29udGVudD5gLFxuICAgICAgICAgICAgZWxlbWVudC5zb3VyY2VTcGFuKTtcbiAgICAgIH1cblxuICAgICAgcGFyc2VkRWxlbWVudCA9IG5ldyBOZ0NvbnRlbnRBc3QoXG4gICAgICAgICAgdGhpcy5uZ0NvbnRlbnRDb3VudCsrLCBoYXNJbmxpbmVUZW1wbGF0ZXMgPyBudWxsIDogbmdDb250ZW50SW5kZXgsIGVsZW1lbnQuc291cmNlU3Bhbik7XG4gICAgfSBlbHNlIGlmIChpc1RlbXBsYXRlRWxlbWVudCkge1xuICAgICAgdGhpcy5fYXNzZXJ0QWxsRXZlbnRzUHVibGlzaGVkQnlEaXJlY3RpdmVzKGRpcmVjdGl2ZXMsIGV2ZW50cyk7XG4gICAgICB0aGlzLl9hc3NlcnROb0NvbXBvbmVudHNOb3JFbGVtZW50QmluZGluZ3NPblRlbXBsYXRlKFxuICAgICAgICAgIGRpcmVjdGl2ZXMsIGVsZW1lbnRQcm9wcywgZWxlbWVudC5zb3VyY2VTcGFuKTtcblxuICAgICAgcGFyc2VkRWxlbWVudCA9IG5ldyBFbWJlZGRlZFRlbXBsYXRlQXN0KFxuICAgICAgICAgIGF0dHJzLCBldmVudHMsIHZhcnMsIGRpcmVjdGl2ZXMsIGNoaWxkcmVuLCBoYXNJbmxpbmVUZW1wbGF0ZXMgPyBudWxsIDogbmdDb250ZW50SW5kZXgsXG4gICAgICAgICAgZWxlbWVudC5zb3VyY2VTcGFuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXNzZXJ0T25seU9uZUNvbXBvbmVudChkaXJlY3RpdmVzLCBlbGVtZW50LnNvdXJjZVNwYW4pO1xuICAgICAgdmFyIGVsZW1lbnRFeHBvcnRBc1ZhcnMgPSB2YXJzLmZpbHRlcih2YXJBc3QgPT4gdmFyQXN0LnZhbHVlLmxlbmd0aCA9PT0gMCk7XG4gICAgICBsZXQgbmdDb250ZW50SW5kZXggPVxuICAgICAgICAgIGhhc0lubGluZVRlbXBsYXRlcyA/IG51bGwgOiBjb21wb25lbnQuZmluZE5nQ29udGVudEluZGV4KHByb2plY3Rpb25TZWxlY3Rvcik7XG5cbiAgICAgIHBhcnNlZEVsZW1lbnQgPSBuZXcgRWxlbWVudEFzdChcbiAgICAgICAgICBub2RlTmFtZSwgYXR0cnMsIGVsZW1lbnRQcm9wcywgZXZlbnRzLCBlbGVtZW50RXhwb3J0QXNWYXJzLCBkaXJlY3RpdmVzLCBjaGlsZHJlbixcbiAgICAgICAgICBoYXNJbmxpbmVUZW1wbGF0ZXMgPyBudWxsIDogbmdDb250ZW50SW5kZXgsIGVsZW1lbnQuc291cmNlU3Bhbik7XG4gICAgfVxuICAgIGlmIChoYXNJbmxpbmVUZW1wbGF0ZXMpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZUNzc1NlbGVjdG9yID0gY3JlYXRlRWxlbWVudENzc1NlbGVjdG9yKFRFTVBMQVRFX0VMRU1FTlQsIHRlbXBsYXRlTWF0Y2hhYmxlQXR0cnMpO1xuICAgICAgdmFyIHRlbXBsYXRlRGlyZWN0aXZlcyA9IHRoaXMuX2NyZWF0ZURpcmVjdGl2ZUFzdHMoXG4gICAgICAgICAgZWxlbWVudC5uYW1lLCB0aGlzLl9wYXJzZURpcmVjdGl2ZXModGhpcy5zZWxlY3Rvck1hdGNoZXIsIHRlbXBsYXRlQ3NzU2VsZWN0b3IpLFxuICAgICAgICAgIHRlbXBsYXRlRWxlbWVudE9yRGlyZWN0aXZlUHJvcHMsIFtdLCBlbGVtZW50LnNvdXJjZVNwYW4pO1xuICAgICAgdmFyIHRlbXBsYXRlRWxlbWVudFByb3BzOiBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdFtdID0gdGhpcy5fY3JlYXRlRWxlbWVudFByb3BlcnR5QXN0cyhcbiAgICAgICAgICBlbGVtZW50Lm5hbWUsIHRlbXBsYXRlRWxlbWVudE9yRGlyZWN0aXZlUHJvcHMsIHRlbXBsYXRlRGlyZWN0aXZlcyk7XG4gICAgICB0aGlzLl9hc3NlcnROb0NvbXBvbmVudHNOb3JFbGVtZW50QmluZGluZ3NPblRlbXBsYXRlKFxuICAgICAgICAgIHRlbXBsYXRlRGlyZWN0aXZlcywgdGVtcGxhdGVFbGVtZW50UHJvcHMsIGVsZW1lbnQuc291cmNlU3Bhbik7XG5cbiAgICAgIHBhcnNlZEVsZW1lbnQgPSBuZXcgRW1iZWRkZWRUZW1wbGF0ZUFzdChcbiAgICAgICAgICBbXSwgW10sIHRlbXBsYXRlVmFycywgdGVtcGxhdGVEaXJlY3RpdmVzLCBbcGFyc2VkRWxlbWVudF0sIG5nQ29udGVudEluZGV4LFxuICAgICAgICAgIGVsZW1lbnQuc291cmNlU3Bhbik7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZWRFbGVtZW50O1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VJbmxpbmVUZW1wbGF0ZUJpbmRpbmcoXG4gICAgICBhdHRyOiBIdG1sQXR0ckFzdCwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnM6IHN0cmluZ1tdW10sXG4gICAgICB0YXJnZXRQcm9wczogQm91bmRFbGVtZW50T3JEaXJlY3RpdmVQcm9wZXJ0eVtdLCB0YXJnZXRWYXJzOiBWYXJpYWJsZUFzdFtdKTogYm9vbGVhbiB7XG4gICAgdmFyIHRlbXBsYXRlQmluZGluZ3NTb3VyY2UgPSBudWxsO1xuICAgIGlmIChhdHRyLm5hbWUgPT0gVEVNUExBVEVfQVRUUikge1xuICAgICAgdGVtcGxhdGVCaW5kaW5nc1NvdXJjZSA9IGF0dHIudmFsdWU7XG4gICAgfSBlbHNlIGlmIChhdHRyLm5hbWUuc3RhcnRzV2l0aChURU1QTEFURV9BVFRSX1BSRUZJWCkpIHtcbiAgICAgIHZhciBrZXkgPSBhdHRyLm5hbWUuc3Vic3RyaW5nKFRFTVBMQVRFX0FUVFJfUFJFRklYLmxlbmd0aCk7ICAvLyByZW1vdmUgdGhlIHN0YXJcbiAgICAgIHRlbXBsYXRlQmluZGluZ3NTb3VyY2UgPSAoYXR0ci52YWx1ZS5sZW5ndGggPT0gMCkgPyBrZXkgOiBrZXkgKyAnICcgKyBhdHRyLnZhbHVlO1xuICAgIH1cbiAgICBpZiAoaXNQcmVzZW50KHRlbXBsYXRlQmluZGluZ3NTb3VyY2UpKSB7XG4gICAgICB2YXIgYmluZGluZ3MgPSB0aGlzLl9wYXJzZVRlbXBsYXRlQmluZGluZ3ModGVtcGxhdGVCaW5kaW5nc1NvdXJjZSwgYXR0ci5zb3VyY2VTcGFuKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICAgICAgaWYgKGJpbmRpbmcua2V5SXNWYXIpIHtcbiAgICAgICAgICB0YXJnZXRWYXJzLnB1c2gobmV3IFZhcmlhYmxlQXN0KGJpbmRpbmcua2V5LCBiaW5kaW5nLm5hbWUsIGF0dHIuc291cmNlU3BhbikpO1xuICAgICAgICAgIHRhcmdldE1hdGNoYWJsZUF0dHJzLnB1c2goW2JpbmRpbmcua2V5LCBiaW5kaW5nLm5hbWVdKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1ByZXNlbnQoYmluZGluZy5leHByZXNzaW9uKSkge1xuICAgICAgICAgIHRoaXMuX3BhcnNlUHJvcGVydHlBc3QoXG4gICAgICAgICAgICAgIGJpbmRpbmcua2V5LCBiaW5kaW5nLmV4cHJlc3Npb24sIGF0dHIuc291cmNlU3BhbiwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnMsIHRhcmdldFByb3BzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXRNYXRjaGFibGVBdHRycy5wdXNoKFtiaW5kaW5nLmtleSwgJyddKTtcbiAgICAgICAgICB0aGlzLl9wYXJzZUxpdGVyYWxBdHRyKGJpbmRpbmcua2V5LCBudWxsLCBhdHRyLnNvdXJjZVNwYW4sIHRhcmdldFByb3BzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlQXR0cihcbiAgICAgIGF0dHI6IEh0bWxBdHRyQXN0LCB0YXJnZXRNYXRjaGFibGVBdHRyczogc3RyaW5nW11bXSxcbiAgICAgIHRhcmdldFByb3BzOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5W10sIHRhcmdldEV2ZW50czogQm91bmRFdmVudEFzdFtdLFxuICAgICAgdGFyZ2V0VmFyczogVmFyaWFibGVBc3RbXSk6IGJvb2xlYW4ge1xuICAgIHZhciBhdHRyTmFtZSA9IHRoaXMuX25vcm1hbGl6ZUF0dHJpYnV0ZU5hbWUoYXR0ci5uYW1lKTtcbiAgICB2YXIgYXR0clZhbHVlID0gYXR0ci52YWx1ZTtcbiAgICB2YXIgYmluZFBhcnRzID0gUmVnRXhwV3JhcHBlci5maXJzdE1hdGNoKEJJTkRfTkFNRV9SRUdFWFAsIGF0dHJOYW1lKTtcbiAgICB2YXIgaGFzQmluZGluZyA9IGZhbHNlO1xuICAgIGlmIChpc1ByZXNlbnQoYmluZFBhcnRzKSkge1xuICAgICAgaGFzQmluZGluZyA9IHRydWU7XG4gICAgICBpZiAoaXNQcmVzZW50KGJpbmRQYXJ0c1sxXSkpIHsgIC8vIG1hdGNoOiBiaW5kLXByb3BcbiAgICAgICAgdGhpcy5fcGFyc2VQcm9wZXJ0eShcbiAgICAgICAgICAgIGJpbmRQYXJ0c1s1XSwgYXR0clZhbHVlLCBhdHRyLnNvdXJjZVNwYW4sIHRhcmdldE1hdGNoYWJsZUF0dHJzLCB0YXJnZXRQcm9wcyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoaXNQcmVzZW50KFxuICAgICAgICAgICAgICAgICAgICAgYmluZFBhcnRzWzJdKSkgeyAgLy8gbWF0Y2g6IHZhci1uYW1lIC8gdmFyLW5hbWU9XCJpZGVuXCIgLyAjbmFtZSAvICNuYW1lPVwiaWRlblwiXG4gICAgICAgIHZhciBpZGVudGlmaWVyID0gYmluZFBhcnRzWzVdO1xuICAgICAgICB0aGlzLl9wYXJzZVZhcmlhYmxlKGlkZW50aWZpZXIsIGF0dHJWYWx1ZSwgYXR0ci5zb3VyY2VTcGFuLCB0YXJnZXRWYXJzKTtcblxuICAgICAgfSBlbHNlIGlmIChpc1ByZXNlbnQoYmluZFBhcnRzWzNdKSkgeyAgLy8gbWF0Y2g6IG9uLWV2ZW50XG4gICAgICAgIHRoaXMuX3BhcnNlRXZlbnQoXG4gICAgICAgICAgICBiaW5kUGFydHNbNV0sIGF0dHJWYWx1ZSwgYXR0ci5zb3VyY2VTcGFuLCB0YXJnZXRNYXRjaGFibGVBdHRycywgdGFyZ2V0RXZlbnRzKTtcblxuICAgICAgfSBlbHNlIGlmIChpc1ByZXNlbnQoYmluZFBhcnRzWzRdKSkgeyAgLy8gbWF0Y2g6IGJpbmRvbi1wcm9wXG4gICAgICAgIHRoaXMuX3BhcnNlUHJvcGVydHkoXG4gICAgICAgICAgICBiaW5kUGFydHNbNV0sIGF0dHJWYWx1ZSwgYXR0ci5zb3VyY2VTcGFuLCB0YXJnZXRNYXRjaGFibGVBdHRycywgdGFyZ2V0UHJvcHMpO1xuICAgICAgICB0aGlzLl9wYXJzZUFzc2lnbm1lbnRFdmVudChcbiAgICAgICAgICAgIGJpbmRQYXJ0c1s1XSwgYXR0clZhbHVlLCBhdHRyLnNvdXJjZVNwYW4sIHRhcmdldE1hdGNoYWJsZUF0dHJzLCB0YXJnZXRFdmVudHMpO1xuXG4gICAgICB9IGVsc2UgaWYgKGlzUHJlc2VudChiaW5kUGFydHNbNl0pKSB7ICAvLyBtYXRjaDogWyhleHByKV1cbiAgICAgICAgdGhpcy5fcGFyc2VQcm9wZXJ0eShcbiAgICAgICAgICAgIGJpbmRQYXJ0c1s2XSwgYXR0clZhbHVlLCBhdHRyLnNvdXJjZVNwYW4sIHRhcmdldE1hdGNoYWJsZUF0dHJzLCB0YXJnZXRQcm9wcyk7XG4gICAgICAgIHRoaXMuX3BhcnNlQXNzaWdubWVudEV2ZW50KFxuICAgICAgICAgICAgYmluZFBhcnRzWzZdLCBhdHRyVmFsdWUsIGF0dHIuc291cmNlU3BhbiwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnMsIHRhcmdldEV2ZW50cyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoaXNQcmVzZW50KGJpbmRQYXJ0c1s3XSkpIHsgIC8vIG1hdGNoOiBbZXhwcl1cbiAgICAgICAgdGhpcy5fcGFyc2VQcm9wZXJ0eShcbiAgICAgICAgICAgIGJpbmRQYXJ0c1s3XSwgYXR0clZhbHVlLCBhdHRyLnNvdXJjZVNwYW4sIHRhcmdldE1hdGNoYWJsZUF0dHJzLCB0YXJnZXRQcm9wcyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoaXNQcmVzZW50KGJpbmRQYXJ0c1s4XSkpIHsgIC8vIG1hdGNoOiAoZXZlbnQpXG4gICAgICAgIHRoaXMuX3BhcnNlRXZlbnQoXG4gICAgICAgICAgICBiaW5kUGFydHNbOF0sIGF0dHJWYWx1ZSwgYXR0ci5zb3VyY2VTcGFuLCB0YXJnZXRNYXRjaGFibGVBdHRycywgdGFyZ2V0RXZlbnRzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaGFzQmluZGluZyA9IHRoaXMuX3BhcnNlUHJvcGVydHlJbnRlcnBvbGF0aW9uKFxuICAgICAgICAgIGF0dHJOYW1lLCBhdHRyVmFsdWUsIGF0dHIuc291cmNlU3BhbiwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnMsIHRhcmdldFByb3BzKTtcbiAgICB9XG4gICAgaWYgKCFoYXNCaW5kaW5nKSB7XG4gICAgICB0aGlzLl9wYXJzZUxpdGVyYWxBdHRyKGF0dHJOYW1lLCBhdHRyVmFsdWUsIGF0dHIuc291cmNlU3BhbiwgdGFyZ2V0UHJvcHMpO1xuICAgIH1cbiAgICByZXR1cm4gaGFzQmluZGluZztcbiAgfVxuXG4gIHByaXZhdGUgX25vcm1hbGl6ZUF0dHJpYnV0ZU5hbWUoYXR0ck5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGF0YS0nKSA/IGF0dHJOYW1lLnN1YnN0cmluZyg1KSA6IGF0dHJOYW1lO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VWYXJpYWJsZShcbiAgICAgIGlkZW50aWZpZXI6IHN0cmluZywgdmFsdWU6IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLCB0YXJnZXRWYXJzOiBWYXJpYWJsZUFzdFtdKSB7XG4gICAgaWYgKGlkZW50aWZpZXIuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKGBcIi1cIiBpcyBub3QgYWxsb3dlZCBpbiB2YXJpYWJsZSBuYW1lc2AsIHNvdXJjZVNwYW4pO1xuICAgIH1cbiAgICB0YXJnZXRWYXJzLnB1c2gobmV3IFZhcmlhYmxlQXN0KGlkZW50aWZpZXIsIHZhbHVlLCBzb3VyY2VTcGFuKSk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVByb3BlcnR5KFxuICAgICAgbmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiBzdHJpbmcsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIHRhcmdldE1hdGNoYWJsZUF0dHJzOiBzdHJpbmdbXVtdLCB0YXJnZXRQcm9wczogQm91bmRFbGVtZW50T3JEaXJlY3RpdmVQcm9wZXJ0eVtdKSB7XG4gICAgdGhpcy5fcGFyc2VQcm9wZXJ0eUFzdChcbiAgICAgICAgbmFtZSwgdGhpcy5fcGFyc2VCaW5kaW5nKGV4cHJlc3Npb24sIHNvdXJjZVNwYW4pLCBzb3VyY2VTcGFuLCB0YXJnZXRNYXRjaGFibGVBdHRycyxcbiAgICAgICAgdGFyZ2V0UHJvcHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VQcm9wZXJ0eUludGVycG9sYXRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbiwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnM6IHN0cmluZ1tdW10sXG4gICAgICB0YXJnZXRQcm9wczogQm91bmRFbGVtZW50T3JEaXJlY3RpdmVQcm9wZXJ0eVtdKTogYm9vbGVhbiB7XG4gICAgdmFyIGV4cHIgPSB0aGlzLl9wYXJzZUludGVycG9sYXRpb24odmFsdWUsIHNvdXJjZVNwYW4pO1xuICAgIGlmIChpc1ByZXNlbnQoZXhwcikpIHtcbiAgICAgIHRoaXMuX3BhcnNlUHJvcGVydHlBc3QobmFtZSwgZXhwciwgc291cmNlU3BhbiwgdGFyZ2V0TWF0Y2hhYmxlQXR0cnMsIHRhcmdldFByb3BzKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVByb3BlcnR5QXN0KFxuICAgICAgbmFtZTogc3RyaW5nLCBhc3Q6IEFTVFdpdGhTb3VyY2UsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIHRhcmdldE1hdGNoYWJsZUF0dHJzOiBzdHJpbmdbXVtdLCB0YXJnZXRQcm9wczogQm91bmRFbGVtZW50T3JEaXJlY3RpdmVQcm9wZXJ0eVtdKSB7XG4gICAgdGFyZ2V0TWF0Y2hhYmxlQXR0cnMucHVzaChbbmFtZSwgYXN0LnNvdXJjZV0pO1xuICAgIHRhcmdldFByb3BzLnB1c2gobmV3IEJvdW5kRWxlbWVudE9yRGlyZWN0aXZlUHJvcGVydHkobmFtZSwgYXN0LCBmYWxzZSwgc291cmNlU3BhbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VBc3NpZ25tZW50RXZlbnQoXG4gICAgICBuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgdGFyZ2V0TWF0Y2hhYmxlQXR0cnM6IHN0cmluZ1tdW10sIHRhcmdldEV2ZW50czogQm91bmRFdmVudEFzdFtdKSB7XG4gICAgdGhpcy5fcGFyc2VFdmVudChcbiAgICAgICAgYCR7bmFtZX1DaGFuZ2VgLCBgJHtleHByZXNzaW9ufT0kZXZlbnRgLCBzb3VyY2VTcGFuLCB0YXJnZXRNYXRjaGFibGVBdHRycywgdGFyZ2V0RXZlbnRzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlRXZlbnQoXG4gICAgICBuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgdGFyZ2V0TWF0Y2hhYmxlQXR0cnM6IHN0cmluZ1tdW10sIHRhcmdldEV2ZW50czogQm91bmRFdmVudEFzdFtdKSB7XG4gICAgLy8gbG9uZyBmb3JtYXQ6ICd0YXJnZXQ6IGV2ZW50TmFtZSdcbiAgICB2YXIgcGFydHMgPSBzcGxpdEF0Q29sb24obmFtZSwgW251bGwsIG5hbWVdKTtcbiAgICB2YXIgdGFyZ2V0ID0gcGFydHNbMF07XG4gICAgdmFyIGV2ZW50TmFtZSA9IHBhcnRzWzFdO1xuICAgIHZhciBhc3QgPSB0aGlzLl9wYXJzZUFjdGlvbihleHByZXNzaW9uLCBzb3VyY2VTcGFuKTtcbiAgICB0YXJnZXRNYXRjaGFibGVBdHRycy5wdXNoKFtuYW1lLCBhc3Quc291cmNlXSk7XG4gICAgdGFyZ2V0RXZlbnRzLnB1c2gobmV3IEJvdW5kRXZlbnRBc3QoZXZlbnROYW1lLCB0YXJnZXQsIGFzdCwgc291cmNlU3BhbikpO1xuICAgIC8vIERvbid0IGRldGVjdCBkaXJlY3RpdmVzIGZvciBldmVudCBuYW1lcyBmb3Igbm93LFxuICAgIC8vIHNvIGRvbid0IGFkZCB0aGUgZXZlbnQgbmFtZSB0byB0aGUgbWF0Y2hhYmxlQXR0cnNcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlTGl0ZXJhbEF0dHIoXG4gICAgICBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIHRhcmdldFByb3BzOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5W10pIHtcbiAgICB0YXJnZXRQcm9wcy5wdXNoKG5ldyBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5KFxuICAgICAgICBuYW1lLCB0aGlzLl9leHByUGFyc2VyLndyYXBMaXRlcmFsUHJpbWl0aXZlKHZhbHVlLCAnJyksIHRydWUsIHNvdXJjZVNwYW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlRGlyZWN0aXZlcyhzZWxlY3Rvck1hdGNoZXI6IFNlbGVjdG9yTWF0Y2hlciwgZWxlbWVudENzc1NlbGVjdG9yOiBDc3NTZWxlY3Rvcik6XG4gICAgICBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGFbXSB7XG4gICAgdmFyIGRpcmVjdGl2ZXMgPSBbXTtcbiAgICBzZWxlY3Rvck1hdGNoZXIubWF0Y2goXG4gICAgICAgIGVsZW1lbnRDc3NTZWxlY3RvciwgKHNlbGVjdG9yLCBkaXJlY3RpdmUpID0+IHsgZGlyZWN0aXZlcy5wdXNoKGRpcmVjdGl2ZSk7IH0pO1xuICAgIC8vIE5lZWQgdG8gc29ydCB0aGUgZGlyZWN0aXZlcyBzbyB0aGF0IHdlIGdldCBjb25zaXN0ZW50IHJlc3VsdHMgdGhyb3VnaG91dCxcbiAgICAvLyBhcyBzZWxlY3Rvck1hdGNoZXIgdXNlcyBNYXBzIGluc2lkZS5cbiAgICAvLyBBbHNvIG5lZWQgdG8gbWFrZSBjb21wb25lbnRzIHRoZSBmaXJzdCBkaXJlY3RpdmUgaW4gdGhlIGFycmF5XG4gICAgTGlzdFdyYXBwZXIuc29ydChcbiAgICAgICAgZGlyZWN0aXZlcywgKGRpcjE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSwgZGlyMjogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhKSA9PiB7XG4gICAgICAgICAgdmFyIGRpcjFDb21wID0gZGlyMS5pc0NvbXBvbmVudDtcbiAgICAgICAgICB2YXIgZGlyMkNvbXAgPSBkaXIyLmlzQ29tcG9uZW50O1xuICAgICAgICAgIGlmIChkaXIxQ29tcCAmJiAhZGlyMkNvbXApIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCFkaXIxQ29tcCAmJiBkaXIyQ29tcCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpcmVjdGl2ZXNJbmRleC5nZXQoZGlyMSkgLSB0aGlzLmRpcmVjdGl2ZXNJbmRleC5nZXQoZGlyMik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICByZXR1cm4gZGlyZWN0aXZlcztcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZURpcmVjdGl2ZUFzdHMoXG4gICAgICBlbGVtZW50TmFtZTogc3RyaW5nLCBkaXJlY3RpdmVzOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGFbXSxcbiAgICAgIHByb3BzOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5W10sIHBvc3NpYmxlRXhwb3J0QXNWYXJzOiBWYXJpYWJsZUFzdFtdLFxuICAgICAgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKTogRGlyZWN0aXZlQXN0W10ge1xuICAgIHZhciBtYXRjaGVkVmFyaWFibGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgdmFyIGRpcmVjdGl2ZUFzdHMgPSBkaXJlY3RpdmVzLm1hcCgoZGlyZWN0aXZlOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEpID0+IHtcbiAgICAgIHZhciBob3N0UHJvcGVydGllczogQm91bmRFbGVtZW50UHJvcGVydHlBc3RbXSA9IFtdO1xuICAgICAgdmFyIGhvc3RFdmVudHM6IEJvdW5kRXZlbnRBc3RbXSA9IFtdO1xuICAgICAgdmFyIGRpcmVjdGl2ZVByb3BlcnRpZXM6IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3RbXSA9IFtdO1xuICAgICAgdGhpcy5fY3JlYXRlRGlyZWN0aXZlSG9zdFByb3BlcnR5QXN0cyhcbiAgICAgICAgICBlbGVtZW50TmFtZSwgZGlyZWN0aXZlLmhvc3RQcm9wZXJ0aWVzLCBzb3VyY2VTcGFuLCBob3N0UHJvcGVydGllcyk7XG4gICAgICB0aGlzLl9jcmVhdGVEaXJlY3RpdmVIb3N0RXZlbnRBc3RzKGRpcmVjdGl2ZS5ob3N0TGlzdGVuZXJzLCBzb3VyY2VTcGFuLCBob3N0RXZlbnRzKTtcbiAgICAgIHRoaXMuX2NyZWF0ZURpcmVjdGl2ZVByb3BlcnR5QXN0cyhkaXJlY3RpdmUuaW5wdXRzLCBwcm9wcywgZGlyZWN0aXZlUHJvcGVydGllcyk7XG4gICAgICB2YXIgZXhwb3J0QXNWYXJzID0gW107XG4gICAgICBwb3NzaWJsZUV4cG9ydEFzVmFycy5mb3JFYWNoKCh2YXJBc3QpID0+IHtcbiAgICAgICAgaWYgKCh2YXJBc3QudmFsdWUubGVuZ3RoID09PSAwICYmIGRpcmVjdGl2ZS5pc0NvbXBvbmVudCkgfHxcbiAgICAgICAgICAgIChkaXJlY3RpdmUuZXhwb3J0QXMgPT0gdmFyQXN0LnZhbHVlKSkge1xuICAgICAgICAgIGV4cG9ydEFzVmFycy5wdXNoKHZhckFzdCk7XG4gICAgICAgICAgbWF0Y2hlZFZhcmlhYmxlcy5hZGQodmFyQXN0Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXcgRGlyZWN0aXZlQXN0KFxuICAgICAgICAgIGRpcmVjdGl2ZSwgZGlyZWN0aXZlUHJvcGVydGllcywgaG9zdFByb3BlcnRpZXMsIGhvc3RFdmVudHMsIGV4cG9ydEFzVmFycywgc291cmNlU3Bhbik7XG4gICAgfSk7XG4gICAgcG9zc2libGVFeHBvcnRBc1ZhcnMuZm9yRWFjaCgodmFyQXN0KSA9PiB7XG4gICAgICBpZiAodmFyQXN0LnZhbHVlLmxlbmd0aCA+IDAgJiYgIVNldFdyYXBwZXIuaGFzKG1hdGNoZWRWYXJpYWJsZXMsIHZhckFzdC5uYW1lKSkge1xuICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgIGBUaGVyZSBpcyBubyBkaXJlY3RpdmUgd2l0aCBcImV4cG9ydEFzXCIgc2V0IHRvIFwiJHt2YXJBc3QudmFsdWV9XCJgLCB2YXJBc3Quc291cmNlU3Bhbik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUFzdHM7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVEaXJlY3RpdmVIb3N0UHJvcGVydHlBc3RzKFxuICAgICAgZWxlbWVudE5hbWU6IHN0cmluZywgaG9zdFByb3BzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgdGFyZ2V0UHJvcGVydHlBc3RzOiBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdFtdKSB7XG4gICAgaWYgKGlzUHJlc2VudChob3N0UHJvcHMpKSB7XG4gICAgICBTdHJpbmdNYXBXcmFwcGVyLmZvckVhY2goaG9zdFByb3BzLCAoZXhwcmVzc2lvbjogc3RyaW5nLCBwcm9wTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHZhciBleHByQXN0ID0gdGhpcy5fcGFyc2VCaW5kaW5nKGV4cHJlc3Npb24sIHNvdXJjZVNwYW4pO1xuICAgICAgICB0YXJnZXRQcm9wZXJ0eUFzdHMucHVzaChcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnRQcm9wZXJ0eUFzdChlbGVtZW50TmFtZSwgcHJvcE5hbWUsIGV4cHJBc3QsIHNvdXJjZVNwYW4pKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZURpcmVjdGl2ZUhvc3RFdmVudEFzdHMoXG4gICAgICBob3N0TGlzdGVuZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgdGFyZ2V0RXZlbnRBc3RzOiBCb3VuZEV2ZW50QXN0W10pIHtcbiAgICBpZiAoaXNQcmVzZW50KGhvc3RMaXN0ZW5lcnMpKSB7XG4gICAgICBTdHJpbmdNYXBXcmFwcGVyLmZvckVhY2goaG9zdExpc3RlbmVycywgKGV4cHJlc3Npb246IHN0cmluZywgcHJvcE5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICB0aGlzLl9wYXJzZUV2ZW50KHByb3BOYW1lLCBleHByZXNzaW9uLCBzb3VyY2VTcGFuLCBbXSwgdGFyZ2V0RXZlbnRBc3RzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZURpcmVjdGl2ZVByb3BlcnR5QXN0cyhcbiAgICAgIGRpcmVjdGl2ZVByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCBib3VuZFByb3BzOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5W10sXG4gICAgICB0YXJnZXRCb3VuZERpcmVjdGl2ZVByb3BzOiBCb3VuZERpcmVjdGl2ZVByb3BlcnR5QXN0W10pIHtcbiAgICBpZiAoaXNQcmVzZW50KGRpcmVjdGl2ZVByb3BlcnRpZXMpKSB7XG4gICAgICB2YXIgYm91bmRQcm9wc0J5TmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5PigpO1xuICAgICAgYm91bmRQcm9wcy5mb3JFYWNoKGJvdW5kUHJvcCA9PiB7XG4gICAgICAgIHZhciBwcmV2VmFsdWUgPSBib3VuZFByb3BzQnlOYW1lLmdldChib3VuZFByb3AubmFtZSk7XG4gICAgICAgIGlmIChpc0JsYW5rKHByZXZWYWx1ZSkgfHwgcHJldlZhbHVlLmlzTGl0ZXJhbCkge1xuICAgICAgICAgIC8vIGdpdmUgW2FdPVwiYlwiIGEgaGlnaGVyIHByZWNlZGVuY2UgdGhhbiBhPVwiYlwiIG9uIHRoZSBzYW1lIGVsZW1lbnRcbiAgICAgICAgICBib3VuZFByb3BzQnlOYW1lLnNldChib3VuZFByb3AubmFtZSwgYm91bmRQcm9wKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIFN0cmluZ01hcFdyYXBwZXIuZm9yRWFjaChkaXJlY3RpdmVQcm9wZXJ0aWVzLCAoZWxQcm9wOiBzdHJpbmcsIGRpclByb3A6IHN0cmluZykgPT4ge1xuICAgICAgICB2YXIgYm91bmRQcm9wID0gYm91bmRQcm9wc0J5TmFtZS5nZXQoZWxQcm9wKTtcblxuICAgICAgICAvLyBCaW5kaW5ncyBhcmUgb3B0aW9uYWwsIHNvIHRoaXMgYmluZGluZyBvbmx5IG5lZWRzIHRvIGJlIHNldCB1cCBpZiBhbiBleHByZXNzaW9uIGlzIGdpdmVuLlxuICAgICAgICBpZiAoaXNQcmVzZW50KGJvdW5kUHJvcCkpIHtcbiAgICAgICAgICB0YXJnZXRCb3VuZERpcmVjdGl2ZVByb3BzLnB1c2gobmV3IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QoXG4gICAgICAgICAgICAgIGRpclByb3AsIGJvdW5kUHJvcC5uYW1lLCBib3VuZFByb3AuZXhwcmVzc2lvbiwgYm91bmRQcm9wLnNvdXJjZVNwYW4pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlRWxlbWVudFByb3BlcnR5QXN0cyhcbiAgICAgIGVsZW1lbnROYW1lOiBzdHJpbmcsIHByb3BzOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5W10sXG4gICAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVBc3RbXSk6IEJvdW5kRWxlbWVudFByb3BlcnR5QXN0W10ge1xuICAgIHZhciBib3VuZEVsZW1lbnRQcm9wczogQm91bmRFbGVtZW50UHJvcGVydHlBc3RbXSA9IFtdO1xuICAgIHZhciBib3VuZERpcmVjdGl2ZVByb3BzSW5kZXggPSBuZXcgTWFwPHN0cmluZywgQm91bmREaXJlY3RpdmVQcm9wZXJ0eUFzdD4oKTtcbiAgICBkaXJlY3RpdmVzLmZvckVhY2goKGRpcmVjdGl2ZTogRGlyZWN0aXZlQXN0KSA9PiB7XG4gICAgICBkaXJlY3RpdmUuaW5wdXRzLmZvckVhY2goKHByb3A6IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QpID0+IHtcbiAgICAgICAgYm91bmREaXJlY3RpdmVQcm9wc0luZGV4LnNldChwcm9wLnRlbXBsYXRlTmFtZSwgcHJvcCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBwcm9wcy5mb3JFYWNoKChwcm9wOiBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5KSA9PiB7XG4gICAgICBpZiAoIXByb3AuaXNMaXRlcmFsICYmIGlzQmxhbmsoYm91bmREaXJlY3RpdmVQcm9wc0luZGV4LmdldChwcm9wLm5hbWUpKSkge1xuICAgICAgICBib3VuZEVsZW1lbnRQcm9wcy5wdXNoKHRoaXMuX2NyZWF0ZUVsZW1lbnRQcm9wZXJ0eUFzdChcbiAgICAgICAgICAgIGVsZW1lbnROYW1lLCBwcm9wLm5hbWUsIHByb3AuZXhwcmVzc2lvbiwgcHJvcC5zb3VyY2VTcGFuKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGJvdW5kRWxlbWVudFByb3BzO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlRWxlbWVudFByb3BlcnR5QXN0KFxuICAgICAgZWxlbWVudE5hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBhc3Q6IEFTVCxcbiAgICAgIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbik6IEJvdW5kRWxlbWVudFByb3BlcnR5QXN0IHtcbiAgICB2YXIgdW5pdCA9IG51bGw7XG4gICAgdmFyIGJpbmRpbmdUeXBlO1xuICAgIHZhciBib3VuZFByb3BlcnR5TmFtZTtcbiAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KFBST1BFUlRZX1BBUlRTX1NFUEFSQVRPUik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgYm91bmRQcm9wZXJ0eU5hbWUgPSB0aGlzLl9zY2hlbWFSZWdpc3RyeS5nZXRNYXBwZWRQcm9wTmFtZShwYXJ0c1swXSk7XG4gICAgICBiaW5kaW5nVHlwZSA9IFByb3BlcnR5QmluZGluZ1R5cGUuUHJvcGVydHk7XG4gICAgICBpZiAoIXRoaXMuX3NjaGVtYVJlZ2lzdHJ5Lmhhc1Byb3BlcnR5KGVsZW1lbnROYW1lLCBib3VuZFByb3BlcnR5TmFtZSkpIHtcbiAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICBgQ2FuJ3QgYmluZCB0byAnJHtib3VuZFByb3BlcnR5TmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gbmF0aXZlIHByb3BlcnR5YCxcbiAgICAgICAgICAgIHNvdXJjZVNwYW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocGFydHNbMF0gPT0gQVRUUklCVVRFX1BSRUZJWCkge1xuICAgICAgICBib3VuZFByb3BlcnR5TmFtZSA9IHBhcnRzWzFdO1xuICAgICAgICBsZXQgbnNTZXBhcmF0b3JJZHggPSBib3VuZFByb3BlcnR5TmFtZS5pbmRleE9mKCc6Jyk7XG4gICAgICAgIGlmIChuc1NlcGFyYXRvcklkeCA+IC0xKSB7XG4gICAgICAgICAgbGV0IG5zID0gYm91bmRQcm9wZXJ0eU5hbWUuc3Vic3RyaW5nKDAsIG5zU2VwYXJhdG9ySWR4KTtcbiAgICAgICAgICBsZXQgbmFtZSA9IGJvdW5kUHJvcGVydHlOYW1lLnN1YnN0cmluZyhuc1NlcGFyYXRvcklkeCArIDEpO1xuICAgICAgICAgIGJvdW5kUHJvcGVydHlOYW1lID0gbWVyZ2VOc0FuZE5hbWUobnMsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGJpbmRpbmdUeXBlID0gUHJvcGVydHlCaW5kaW5nVHlwZS5BdHRyaWJ1dGU7XG4gICAgICB9IGVsc2UgaWYgKHBhcnRzWzBdID09IENMQVNTX1BSRUZJWCkge1xuICAgICAgICBib3VuZFByb3BlcnR5TmFtZSA9IHBhcnRzWzFdO1xuICAgICAgICBiaW5kaW5nVHlwZSA9IFByb3BlcnR5QmluZGluZ1R5cGUuQ2xhc3M7XG4gICAgICB9IGVsc2UgaWYgKHBhcnRzWzBdID09IFNUWUxFX1BSRUZJWCkge1xuICAgICAgICB1bml0ID0gcGFydHMubGVuZ3RoID4gMiA/IHBhcnRzWzJdIDogbnVsbDtcbiAgICAgICAgYm91bmRQcm9wZXJ0eU5hbWUgPSBwYXJ0c1sxXTtcbiAgICAgICAgYmluZGluZ1R5cGUgPSBQcm9wZXJ0eUJpbmRpbmdUeXBlLlN0eWxlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoYEludmFsaWQgcHJvcGVydHkgbmFtZSAnJHtuYW1lfSdgLCBzb3VyY2VTcGFuKTtcbiAgICAgICAgYmluZGluZ1R5cGUgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgQm91bmRFbGVtZW50UHJvcGVydHlBc3QoYm91bmRQcm9wZXJ0eU5hbWUsIGJpbmRpbmdUeXBlLCBhc3QsIHVuaXQsIHNvdXJjZVNwYW4pO1xuICB9XG5cblxuICBwcml2YXRlIF9maW5kQ29tcG9uZW50RGlyZWN0aXZlTmFtZXMoZGlyZWN0aXZlczogRGlyZWN0aXZlQXN0W10pOiBzdHJpbmdbXSB7XG4gICAgdmFyIGNvbXBvbmVudFR5cGVOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBkaXJlY3RpdmVzLmZvckVhY2goZGlyZWN0aXZlID0+IHtcbiAgICAgIHZhciB0eXBlTmFtZSA9IGRpcmVjdGl2ZS5kaXJlY3RpdmUudHlwZS5uYW1lO1xuICAgICAgaWYgKGRpcmVjdGl2ZS5kaXJlY3RpdmUuaXNDb21wb25lbnQpIHtcbiAgICAgICAgY29tcG9uZW50VHlwZU5hbWVzLnB1c2godHlwZU5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb21wb25lbnRUeXBlTmFtZXM7XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnRPbmx5T25lQ29tcG9uZW50KGRpcmVjdGl2ZXM6IERpcmVjdGl2ZUFzdFtdLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHtcbiAgICB2YXIgY29tcG9uZW50VHlwZU5hbWVzID0gdGhpcy5fZmluZENvbXBvbmVudERpcmVjdGl2ZU5hbWVzKGRpcmVjdGl2ZXMpO1xuICAgIGlmIChjb21wb25lbnRUeXBlTmFtZXMubGVuZ3RoID4gMSkge1xuICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoYE1vcmUgdGhhbiBvbmUgY29tcG9uZW50OiAke2NvbXBvbmVudFR5cGVOYW1lcy5qb2luKCcsJyl9YCwgc291cmNlU3Bhbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYXNzZXJ0Tm9Db21wb25lbnRzTm9yRWxlbWVudEJpbmRpbmdzT25UZW1wbGF0ZShcbiAgICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZUFzdFtdLCBlbGVtZW50UHJvcHM6IEJvdW5kRWxlbWVudFByb3BlcnR5QXN0W10sXG4gICAgICBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHtcbiAgICB2YXIgY29tcG9uZW50VHlwZU5hbWVzOiBzdHJpbmdbXSA9IHRoaXMuX2ZpbmRDb21wb25lbnREaXJlY3RpdmVOYW1lcyhkaXJlY3RpdmVzKTtcbiAgICBpZiAoY29tcG9uZW50VHlwZU5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgIGBDb21wb25lbnRzIG9uIGFuIGVtYmVkZGVkIHRlbXBsYXRlOiAke2NvbXBvbmVudFR5cGVOYW1lcy5qb2luKCcsJyl9YCwgc291cmNlU3Bhbik7XG4gICAgfVxuICAgIGVsZW1lbnRQcm9wcy5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgYFByb3BlcnR5IGJpbmRpbmcgJHtwcm9wLm5hbWV9IG5vdCB1c2VkIGJ5IGFueSBkaXJlY3RpdmUgb24gYW4gZW1iZWRkZWQgdGVtcGxhdGVgLFxuICAgICAgICAgIHNvdXJjZVNwYW4pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXNzZXJ0QWxsRXZlbnRzUHVibGlzaGVkQnlEaXJlY3RpdmVzKFxuICAgICAgZGlyZWN0aXZlczogRGlyZWN0aXZlQXN0W10sIGV2ZW50czogQm91bmRFdmVudEFzdFtdKSB7XG4gICAgdmFyIGFsbERpcmVjdGl2ZUV2ZW50cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGRpcmVjdGl2ZXMuZm9yRWFjaChkaXJlY3RpdmUgPT4ge1xuICAgICAgU3RyaW5nTWFwV3JhcHBlci5mb3JFYWNoKGRpcmVjdGl2ZS5kaXJlY3RpdmUub3V0cHV0cywgKGV2ZW50TmFtZTogc3RyaW5nLCBfKSA9PiB7XG4gICAgICAgIGFsbERpcmVjdGl2ZUV2ZW50cy5hZGQoZXZlbnROYW1lKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmIChpc1ByZXNlbnQoZXZlbnQudGFyZ2V0KSB8fCAhU2V0V3JhcHBlci5oYXMoYWxsRGlyZWN0aXZlRXZlbnRzLCBldmVudC5uYW1lKSkge1xuICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgIGBFdmVudCBiaW5kaW5nICR7ZXZlbnQuZnVsbE5hbWV9IG5vdCBlbWl0dGVkIGJ5IGFueSBkaXJlY3RpdmUgb24gYW4gZW1iZWRkZWQgdGVtcGxhdGVgLFxuICAgICAgICAgICAgZXZlbnQuc291cmNlU3Bhbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgTm9uQmluZGFibGVWaXNpdG9yIGltcGxlbWVudHMgSHRtbEFzdFZpc2l0b3Ige1xuICB2aXNpdEVsZW1lbnQoYXN0OiBIdG1sRWxlbWVudEFzdCwgY29tcG9uZW50OiBDb21wb25lbnQpOiBFbGVtZW50QXN0IHtcbiAgICB2YXIgcHJlcGFyc2VkRWxlbWVudCA9IHByZXBhcnNlRWxlbWVudChhc3QpO1xuICAgIGlmIChwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNDUklQVCB8fFxuICAgICAgICBwcmVwYXJzZWRFbGVtZW50LnR5cGUgPT09IFByZXBhcnNlZEVsZW1lbnRUeXBlLlNUWUxFIHx8XG4gICAgICAgIHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuU1RZTEVTSEVFVCkge1xuICAgICAgLy8gU2tpcHBpbmcgPHNjcmlwdD4gZm9yIHNlY3VyaXR5IHJlYXNvbnNcbiAgICAgIC8vIFNraXBwaW5nIDxzdHlsZT4gYW5kIHN0eWxlc2hlZXRzIGFzIHdlIGFscmVhZHkgcHJvY2Vzc2VkIHRoZW1cbiAgICAgIC8vIGluIHRoZSBTdHlsZUNvbXBpbGVyXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgYXR0ck5hbWVBbmRWYWx1ZXMgPSBhc3QuYXR0cnMubWFwKGF0dHJBc3QgPT4gW2F0dHJBc3QubmFtZSwgYXR0ckFzdC52YWx1ZV0pO1xuICAgIHZhciBzZWxlY3RvciA9IGNyZWF0ZUVsZW1lbnRDc3NTZWxlY3Rvcihhc3QubmFtZSwgYXR0ck5hbWVBbmRWYWx1ZXMpO1xuICAgIHZhciBuZ0NvbnRlbnRJbmRleCA9IGNvbXBvbmVudC5maW5kTmdDb250ZW50SW5kZXgoc2VsZWN0b3IpO1xuICAgIHZhciBjaGlsZHJlbiA9IGh0bWxWaXNpdEFsbCh0aGlzLCBhc3QuY2hpbGRyZW4sIEVNUFRZX0NPTVBPTkVOVCk7XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50QXN0KFxuICAgICAgICBhc3QubmFtZSwgaHRtbFZpc2l0QWxsKHRoaXMsIGFzdC5hdHRycyksIFtdLCBbXSwgW10sIFtdLCBjaGlsZHJlbiwgbmdDb250ZW50SW5kZXgsXG4gICAgICAgIGFzdC5zb3VyY2VTcGFuKTtcbiAgfVxuICB2aXNpdENvbW1lbnQoYXN0OiBIdG1sQ29tbWVudEFzdCwgY29udGV4dDogYW55KTogYW55IHsgcmV0dXJuIG51bGw7IH1cbiAgdmlzaXRBdHRyKGFzdDogSHRtbEF0dHJBc3QsIGNvbnRleHQ6IGFueSk6IEF0dHJBc3Qge1xuICAgIHJldHVybiBuZXcgQXR0ckFzdChhc3QubmFtZSwgYXN0LnZhbHVlLCBhc3Quc291cmNlU3Bhbik7XG4gIH1cbiAgdmlzaXRUZXh0KGFzdDogSHRtbFRleHRBc3QsIGNvbXBvbmVudDogQ29tcG9uZW50KTogVGV4dEFzdCB7XG4gICAgdmFyIG5nQ29udGVudEluZGV4ID0gY29tcG9uZW50LmZpbmROZ0NvbnRlbnRJbmRleChURVhUX0NTU19TRUxFQ1RPUik7XG4gICAgcmV0dXJuIG5ldyBUZXh0QXN0KGFzdC52YWx1ZSwgbmdDb250ZW50SW5kZXgsIGFzdC5zb3VyY2VTcGFuKTtcbiAgfVxufVxuXG5jbGFzcyBCb3VuZEVsZW1lbnRPckRpcmVjdGl2ZVByb3BlcnR5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgZXhwcmVzc2lvbjogQVNULCBwdWJsaWMgaXNMaXRlcmFsOiBib29sZWFuLFxuICAgICAgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0Q2xhc3NlcyhjbGFzc0F0dHJWYWx1ZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gU3RyaW5nV3JhcHBlci5zcGxpdChjbGFzc0F0dHJWYWx1ZS50cmltKCksIC9cXHMrL2cpO1xufVxuXG5jbGFzcyBDb21wb25lbnQge1xuICBzdGF0aWMgY3JlYXRlKGRpcmVjdGl2ZXM6IERpcmVjdGl2ZUFzdFtdKTogQ29tcG9uZW50IHtcbiAgICBpZiAoZGlyZWN0aXZlcy5sZW5ndGggPT09IDAgfHwgIWRpcmVjdGl2ZXNbMF0uZGlyZWN0aXZlLmlzQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm4gRU1QVFlfQ09NUE9ORU5UO1xuICAgIH1cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBTZWxlY3Rvck1hdGNoZXIoKTtcbiAgICB2YXIgbmdDb250ZW50U2VsZWN0b3JzID0gZGlyZWN0aXZlc1swXS5kaXJlY3RpdmUudGVtcGxhdGUubmdDb250ZW50U2VsZWN0b3JzO1xuICAgIHZhciB3aWxkY2FyZE5nQ29udGVudEluZGV4ID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5nQ29udGVudFNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNlbGVjdG9yID0gbmdDb250ZW50U2VsZWN0b3JzW2ldO1xuICAgICAgaWYgKFN0cmluZ1dyYXBwZXIuZXF1YWxzKHNlbGVjdG9yLCAnKicpKSB7XG4gICAgICAgIHdpbGRjYXJkTmdDb250ZW50SW5kZXggPSBpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWF0Y2hlci5hZGRTZWxlY3RhYmxlcyhDc3NTZWxlY3Rvci5wYXJzZShuZ0NvbnRlbnRTZWxlY3RvcnNbaV0pLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnQobWF0Y2hlciwgd2lsZGNhcmROZ0NvbnRlbnRJbmRleCk7XG4gIH1cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgbmdDb250ZW50SW5kZXhNYXRjaGVyOiBTZWxlY3Rvck1hdGNoZXIsIHB1YmxpYyB3aWxkY2FyZE5nQ29udGVudEluZGV4OiBudW1iZXIpIHt9XG5cbiAgZmluZE5nQ29udGVudEluZGV4KHNlbGVjdG9yOiBDc3NTZWxlY3Rvcik6IG51bWJlciB7XG4gICAgdmFyIG5nQ29udGVudEluZGljZXMgPSBbXTtcbiAgICB0aGlzLm5nQ29udGVudEluZGV4TWF0Y2hlci5tYXRjaChcbiAgICAgICAgc2VsZWN0b3IsIChzZWxlY3RvciwgbmdDb250ZW50SW5kZXgpID0+IHsgbmdDb250ZW50SW5kaWNlcy5wdXNoKG5nQ29udGVudEluZGV4KTsgfSk7XG4gICAgTGlzdFdyYXBwZXIuc29ydChuZ0NvbnRlbnRJbmRpY2VzKTtcbiAgICBpZiAoaXNQcmVzZW50KHRoaXMud2lsZGNhcmROZ0NvbnRlbnRJbmRleCkpIHtcbiAgICAgIG5nQ29udGVudEluZGljZXMucHVzaCh0aGlzLndpbGRjYXJkTmdDb250ZW50SW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gbmdDb250ZW50SW5kaWNlcy5sZW5ndGggPiAwID8gbmdDb250ZW50SW5kaWNlc1swXSA6IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudENzc1NlbGVjdG9yKGVsZW1lbnROYW1lOiBzdHJpbmcsIG1hdGNoYWJsZUF0dHJzOiBzdHJpbmdbXVtdKTogQ3NzU2VsZWN0b3Ige1xuICB2YXIgY3NzU2VsZWN0b3IgPSBuZXcgQ3NzU2VsZWN0b3IoKTtcbiAgbGV0IGVsTmFtZU5vTnMgPSBzcGxpdE5zTmFtZShlbGVtZW50TmFtZSlbMV07XG5cbiAgY3NzU2VsZWN0b3Iuc2V0RWxlbWVudChlbE5hbWVOb05zKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoYWJsZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGF0dHJOYW1lID0gbWF0Y2hhYmxlQXR0cnNbaV1bMF07XG4gICAgbGV0IGF0dHJOYW1lTm9OcyA9IHNwbGl0TnNOYW1lKGF0dHJOYW1lKVsxXTtcbiAgICBsZXQgYXR0clZhbHVlID0gbWF0Y2hhYmxlQXR0cnNbaV1bMV07XG5cbiAgICBjc3NTZWxlY3Rvci5hZGRBdHRyaWJ1dGUoYXR0ck5hbWVOb05zLCBhdHRyVmFsdWUpO1xuICAgIGlmIChhdHRyTmFtZS50b0xvd2VyQ2FzZSgpID09IENMQVNTX0FUVFIpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gc3BsaXRDbGFzc2VzKGF0dHJWYWx1ZSk7XG4gICAgICBjbGFzc2VzLmZvckVhY2goY2xhc3NOYW1lID0+IGNzc1NlbGVjdG9yLmFkZENsYXNzTmFtZShjbGFzc05hbWUpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNzc1NlbGVjdG9yO1xufVxuXG52YXIgRU1QVFlfQ09NUE9ORU5UID0gbmV3IENvbXBvbmVudChuZXcgU2VsZWN0b3JNYXRjaGVyKCksIG51bGwpO1xudmFyIE5PTl9CSU5EQUJMRV9WSVNJVE9SID0gbmV3IE5vbkJpbmRhYmxlVmlzaXRvcigpO1xuXG5cbmV4cG9ydCBjbGFzcyBQaXBlQ29sbGVjdG9yIGV4dGVuZHMgUmVjdXJzaXZlQXN0VmlzaXRvciB7XG4gIHBpcGVzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICB2aXNpdFBpcGUoYXN0OiBCaW5kaW5nUGlwZSk6IGFueSB7XG4gICAgdGhpcy5waXBlcy5hZGQoYXN0Lm5hbWUpO1xuICAgIGFzdC5leHAudmlzaXQodGhpcyk7XG4gICAgdGhpcy52aXNpdEFsbChhc3QuYXJncyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==