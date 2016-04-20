/* */ 
"format esm";
import { isPresent, isBlank } from 'angular2/src/facade/lang';
const DIRECTIVE_LIFECYCLE = "directiveLifecycle";
const BINDING = "native";
const DIRECTIVE = "directive";
const ELEMENT_PROPERTY = "elementProperty";
const ELEMENT_ATTRIBUTE = "elementAttribute";
const ELEMENT_CLASS = "elementClass";
const ELEMENT_STYLE = "elementStyle";
const TEXT_NODE = "textNode";
const EVENT = "event";
const HOST_EVENT = "hostEvent";
export class BindingTarget {
    constructor(mode, elementIndex, name, unit, debug) {
        this.mode = mode;
        this.elementIndex = elementIndex;
        this.name = name;
        this.unit = unit;
        this.debug = debug;
    }
    isDirective() { return this.mode === DIRECTIVE; }
    isElementProperty() { return this.mode === ELEMENT_PROPERTY; }
    isElementAttribute() { return this.mode === ELEMENT_ATTRIBUTE; }
    isElementClass() { return this.mode === ELEMENT_CLASS; }
    isElementStyle() { return this.mode === ELEMENT_STYLE; }
    isTextNode() { return this.mode === TEXT_NODE; }
}
export class BindingRecord {
    constructor(mode, target, implicitReceiver, ast, setter, lifecycleEvent, directiveRecord) {
        this.mode = mode;
        this.target = target;
        this.implicitReceiver = implicitReceiver;
        this.ast = ast;
        this.setter = setter;
        this.lifecycleEvent = lifecycleEvent;
        this.directiveRecord = directiveRecord;
    }
    isDirectiveLifecycle() { return this.mode === DIRECTIVE_LIFECYCLE; }
    callOnChanges() {
        return isPresent(this.directiveRecord) && this.directiveRecord.callOnChanges;
    }
    isDefaultChangeDetection() {
        return isBlank(this.directiveRecord) || this.directiveRecord.isDefaultChangeDetection();
    }
    static createDirectiveDoCheck(directiveRecord) {
        return new BindingRecord(DIRECTIVE_LIFECYCLE, null, 0, null, null, "DoCheck", directiveRecord);
    }
    static createDirectiveOnInit(directiveRecord) {
        return new BindingRecord(DIRECTIVE_LIFECYCLE, null, 0, null, null, "OnInit", directiveRecord);
    }
    static createDirectiveOnChanges(directiveRecord) {
        return new BindingRecord(DIRECTIVE_LIFECYCLE, null, 0, null, null, "OnChanges", directiveRecord);
    }
    static createForDirective(ast, propertyName, setter, directiveRecord) {
        var elementIndex = directiveRecord.directiveIndex.elementIndex;
        var t = new BindingTarget(DIRECTIVE, elementIndex, propertyName, null, ast.toString());
        return new BindingRecord(DIRECTIVE, t, 0, ast, setter, null, directiveRecord);
    }
    static createForElementProperty(ast, elementIndex, propertyName) {
        var t = new BindingTarget(ELEMENT_PROPERTY, elementIndex, propertyName, null, ast.toString());
        return new BindingRecord(BINDING, t, 0, ast, null, null, null);
    }
    static createForElementAttribute(ast, elementIndex, attributeName) {
        var t = new BindingTarget(ELEMENT_ATTRIBUTE, elementIndex, attributeName, null, ast.toString());
        return new BindingRecord(BINDING, t, 0, ast, null, null, null);
    }
    static createForElementClass(ast, elementIndex, className) {
        var t = new BindingTarget(ELEMENT_CLASS, elementIndex, className, null, ast.toString());
        return new BindingRecord(BINDING, t, 0, ast, null, null, null);
    }
    static createForElementStyle(ast, elementIndex, styleName, unit) {
        var t = new BindingTarget(ELEMENT_STYLE, elementIndex, styleName, unit, ast.toString());
        return new BindingRecord(BINDING, t, 0, ast, null, null, null);
    }
    static createForHostProperty(directiveIndex, ast, propertyName) {
        var t = new BindingTarget(ELEMENT_PROPERTY, directiveIndex.elementIndex, propertyName, null, ast.toString());
        return new BindingRecord(BINDING, t, directiveIndex, ast, null, null, null);
    }
    static createForHostAttribute(directiveIndex, ast, attributeName) {
        var t = new BindingTarget(ELEMENT_ATTRIBUTE, directiveIndex.elementIndex, attributeName, null, ast.toString());
        return new BindingRecord(BINDING, t, directiveIndex, ast, null, null, null);
    }
    static createForHostClass(directiveIndex, ast, className) {
        var t = new BindingTarget(ELEMENT_CLASS, directiveIndex.elementIndex, className, null, ast.toString());
        return new BindingRecord(BINDING, t, directiveIndex, ast, null, null, null);
    }
    static createForHostStyle(directiveIndex, ast, styleName, unit) {
        var t = new BindingTarget(ELEMENT_STYLE, directiveIndex.elementIndex, styleName, unit, ast.toString());
        return new BindingRecord(BINDING, t, directiveIndex, ast, null, null, null);
    }
    static createForTextNode(ast, elementIndex) {
        var t = new BindingTarget(TEXT_NODE, elementIndex, null, null, ast.toString());
        return new BindingRecord(BINDING, t, 0, ast, null, null, null);
    }
    static createForEvent(ast, eventName, elementIndex) {
        var t = new BindingTarget(EVENT, elementIndex, eventName, null, ast.toString());
        return new BindingRecord(EVENT, t, 0, ast, null, null, null);
    }
    static createForHostEvent(ast, eventName, directiveRecord) {
        var directiveIndex = directiveRecord.directiveIndex;
        var t = new BindingTarget(HOST_EVENT, directiveIndex.elementIndex, eventName, null, ast.toString());
        return new BindingRecord(HOST_EVENT, t, directiveIndex, ast, null, null, directiveRecord);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ19yZWNvcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLW9YRE80cDJ2LnRtcC9hbmd1bGFyMi9zcmMvY29yZS9jaGFuZ2VfZGV0ZWN0aW9uL2JpbmRpbmdfcmVjb3JkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJPQUFPLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQyxNQUFNLDBCQUEwQjtBQUszRCxNQUFNLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDO0FBQ2pELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQztBQUV6QixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUM7QUFDOUIsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQztBQUMzQyxNQUFNLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDO0FBQzdDLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQztBQUNyQyxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUM7QUFDckMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDO0FBQzdCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUN0QixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7QUFFL0I7SUFDRSxZQUFtQixJQUFZLEVBQVMsWUFBb0IsRUFBUyxJQUFZLEVBQzlELElBQVksRUFBUyxLQUFhO1FBRGxDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUFTLFNBQUksR0FBSixJQUFJLENBQVE7UUFDOUQsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFTLFVBQUssR0FBTCxLQUFLLENBQVE7SUFBRyxDQUFDO0lBRXpELFdBQVcsS0FBYyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBRTFELGlCQUFpQixLQUFjLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUV2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cEQsSUFBSSxDQUFDLEdBQ0QsSUFBSSxhQUFhLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNoRyxNQUFNLENBQUMsSUFBSSxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxjQUFjLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDNUYsQ0FBQztBQUNILENBQUM7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7aXNQcmVzZW50LCBpc0JsYW5rfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuaW1wb3J0IHtTZXR0ZXJGbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvcmVmbGVjdGlvbi90eXBlcyc7XG5pbXBvcnQge0FTVH0gZnJvbSAnLi9wYXJzZXIvYXN0JztcbmltcG9ydCB7RGlyZWN0aXZlSW5kZXgsIERpcmVjdGl2ZVJlY29yZH0gZnJvbSAnLi9kaXJlY3RpdmVfcmVjb3JkJztcblxuY29uc3QgRElSRUNUSVZFX0xJRkVDWUNMRSA9IFwiZGlyZWN0aXZlTGlmZWN5Y2xlXCI7XG5jb25zdCBCSU5ESU5HID0gXCJuYXRpdmVcIjtcblxuY29uc3QgRElSRUNUSVZFID0gXCJkaXJlY3RpdmVcIjtcbmNvbnN0IEVMRU1FTlRfUFJPUEVSVFkgPSBcImVsZW1lbnRQcm9wZXJ0eVwiO1xuY29uc3QgRUxFTUVOVF9BVFRSSUJVVEUgPSBcImVsZW1lbnRBdHRyaWJ1dGVcIjtcbmNvbnN0IEVMRU1FTlRfQ0xBU1MgPSBcImVsZW1lbnRDbGFzc1wiO1xuY29uc3QgRUxFTUVOVF9TVFlMRSA9IFwiZWxlbWVudFN0eWxlXCI7XG5jb25zdCBURVhUX05PREUgPSBcInRleHROb2RlXCI7XG5jb25zdCBFVkVOVCA9IFwiZXZlbnRcIjtcbmNvbnN0IEhPU1RfRVZFTlQgPSBcImhvc3RFdmVudFwiO1xuXG5leHBvcnQgY2xhc3MgQmluZGluZ1RhcmdldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtb2RlOiBzdHJpbmcsIHB1YmxpYyBlbGVtZW50SW5kZXg6IG51bWJlciwgcHVibGljIG5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgcHVibGljIHVuaXQ6IHN0cmluZywgcHVibGljIGRlYnVnOiBzdHJpbmcpIHt9XG5cbiAgaXNEaXJlY3RpdmUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLm1vZGUgPT09IERJUkVDVElWRTsgfVxuXG4gIGlzRWxlbWVudFByb3BlcnR5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5tb2RlID09PSBFTEVNRU5UX1BST1BFUlRZOyB9XG5cbiAgaXNFbGVtZW50QXR0cmlidXRlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5tb2RlID09PSBFTEVNRU5UX0FUVFJJQlVURTsgfVxuXG4gIGlzRWxlbWVudENsYXNzKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5tb2RlID09PSBFTEVNRU5UX0NMQVNTOyB9XG5cbiAgaXNFbGVtZW50U3R5bGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLm1vZGUgPT09IEVMRU1FTlRfU1RZTEU7IH1cblxuICBpc1RleHROb2RlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5tb2RlID09PSBURVhUX05PREU7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEJpbmRpbmdSZWNvcmQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbW9kZTogc3RyaW5nLCBwdWJsaWMgdGFyZ2V0OiBCaW5kaW5nVGFyZ2V0LCBwdWJsaWMgaW1wbGljaXRSZWNlaXZlcjogYW55LFxuICAgICAgICAgICAgICBwdWJsaWMgYXN0OiBBU1QsIHB1YmxpYyBzZXR0ZXI6IFNldHRlckZuLCBwdWJsaWMgbGlmZWN5Y2xlRXZlbnQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgcHVibGljIGRpcmVjdGl2ZVJlY29yZDogRGlyZWN0aXZlUmVjb3JkKSB7fVxuXG4gIGlzRGlyZWN0aXZlTGlmZWN5Y2xlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5tb2RlID09PSBESVJFQ1RJVkVfTElGRUNZQ0xFOyB9XG5cbiAgY2FsbE9uQ2hhbmdlcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaXNQcmVzZW50KHRoaXMuZGlyZWN0aXZlUmVjb3JkKSAmJiB0aGlzLmRpcmVjdGl2ZVJlY29yZC5jYWxsT25DaGFuZ2VzO1xuICB9XG5cbiAgaXNEZWZhdWx0Q2hhbmdlRGV0ZWN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0JsYW5rKHRoaXMuZGlyZWN0aXZlUmVjb3JkKSB8fCB0aGlzLmRpcmVjdGl2ZVJlY29yZC5pc0RlZmF1bHRDaGFuZ2VEZXRlY3Rpb24oKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVEaXJlY3RpdmVEb0NoZWNrKGRpcmVjdGl2ZVJlY29yZDogRGlyZWN0aXZlUmVjb3JkKTogQmluZGluZ1JlY29yZCB7XG4gICAgcmV0dXJuIG5ldyBCaW5kaW5nUmVjb3JkKERJUkVDVElWRV9MSUZFQ1lDTEUsIG51bGwsIDAsIG51bGwsIG51bGwsIFwiRG9DaGVja1wiLCBkaXJlY3RpdmVSZWNvcmQpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZURpcmVjdGl2ZU9uSW5pdChkaXJlY3RpdmVSZWNvcmQ6IERpcmVjdGl2ZVJlY29yZCk6IEJpbmRpbmdSZWNvcmQge1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChESVJFQ1RJVkVfTElGRUNZQ0xFLCBudWxsLCAwLCBudWxsLCBudWxsLCBcIk9uSW5pdFwiLCBkaXJlY3RpdmVSZWNvcmQpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZURpcmVjdGl2ZU9uQ2hhbmdlcyhkaXJlY3RpdmVSZWNvcmQ6IERpcmVjdGl2ZVJlY29yZCk6IEJpbmRpbmdSZWNvcmQge1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChESVJFQ1RJVkVfTElGRUNZQ0xFLCBudWxsLCAwLCBudWxsLCBudWxsLCBcIk9uQ2hhbmdlc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVSZWNvcmQpO1xuICB9XG5cblxuXG4gIHN0YXRpYyBjcmVhdGVGb3JEaXJlY3RpdmUoYXN0OiBBU1QsIHByb3BlcnR5TmFtZTogc3RyaW5nLCBzZXR0ZXI6IFNldHRlckZuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZVJlY29yZDogRGlyZWN0aXZlUmVjb3JkKTogQmluZGluZ1JlY29yZCB7XG4gICAgdmFyIGVsZW1lbnRJbmRleCA9IGRpcmVjdGl2ZVJlY29yZC5kaXJlY3RpdmVJbmRleC5lbGVtZW50SW5kZXg7XG4gICAgdmFyIHQgPSBuZXcgQmluZGluZ1RhcmdldChESVJFQ1RJVkUsIGVsZW1lbnRJbmRleCwgcHJvcGVydHlOYW1lLCBudWxsLCBhc3QudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIG5ldyBCaW5kaW5nUmVjb3JkKERJUkVDVElWRSwgdCwgMCwgYXN0LCBzZXR0ZXIsIG51bGwsIGRpcmVjdGl2ZVJlY29yZCk7XG4gIH1cblxuXG5cbiAgc3RhdGljIGNyZWF0ZUZvckVsZW1lbnRQcm9wZXJ0eShhc3Q6IEFTVCwgZWxlbWVudEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiBzdHJpbmcpOiBCaW5kaW5nUmVjb3JkIHtcbiAgICB2YXIgdCA9IG5ldyBCaW5kaW5nVGFyZ2V0KEVMRU1FTlRfUFJPUEVSVFksIGVsZW1lbnRJbmRleCwgcHJvcGVydHlOYW1lLCBudWxsLCBhc3QudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIG5ldyBCaW5kaW5nUmVjb3JkKEJJTkRJTkcsIHQsIDAsIGFzdCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlRm9yRWxlbWVudEF0dHJpYnV0ZShhc3Q6IEFTVCwgZWxlbWVudEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IHN0cmluZyk6IEJpbmRpbmdSZWNvcmQge1xuICAgIHZhciB0ID0gbmV3IEJpbmRpbmdUYXJnZXQoRUxFTUVOVF9BVFRSSUJVVEUsIGVsZW1lbnRJbmRleCwgYXR0cmlidXRlTmFtZSwgbnVsbCwgYXN0LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChCSU5ESU5HLCB0LCAwLCBhc3QsIG51bGwsIG51bGwsIG51bGwpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUZvckVsZW1lbnRDbGFzcyhhc3Q6IEFTVCwgZWxlbWVudEluZGV4OiBudW1iZXIsIGNsYXNzTmFtZTogc3RyaW5nKTogQmluZGluZ1JlY29yZCB7XG4gICAgdmFyIHQgPSBuZXcgQmluZGluZ1RhcmdldChFTEVNRU5UX0NMQVNTLCBlbGVtZW50SW5kZXgsIGNsYXNzTmFtZSwgbnVsbCwgYXN0LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChCSU5ESU5HLCB0LCAwLCBhc3QsIG51bGwsIG51bGwsIG51bGwpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUZvckVsZW1lbnRTdHlsZShhc3Q6IEFTVCwgZWxlbWVudEluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQ6IHN0cmluZyk6IEJpbmRpbmdSZWNvcmQge1xuICAgIHZhciB0ID0gbmV3IEJpbmRpbmdUYXJnZXQoRUxFTUVOVF9TVFlMRSwgZWxlbWVudEluZGV4LCBzdHlsZU5hbWUsIHVuaXQsIGFzdC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gbmV3IEJpbmRpbmdSZWNvcmQoQklORElORywgdCwgMCwgYXN0LCBudWxsLCBudWxsLCBudWxsKTtcbiAgfVxuXG5cblxuICBzdGF0aWMgY3JlYXRlRm9ySG9zdFByb3BlcnR5KGRpcmVjdGl2ZUluZGV4OiBEaXJlY3RpdmVJbmRleCwgYXN0OiBBU1QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiBzdHJpbmcpOiBCaW5kaW5nUmVjb3JkIHtcbiAgICB2YXIgdCA9IG5ldyBCaW5kaW5nVGFyZ2V0KEVMRU1FTlRfUFJPUEVSVFksIGRpcmVjdGl2ZUluZGV4LmVsZW1lbnRJbmRleCwgcHJvcGVydHlOYW1lLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN0LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChCSU5ESU5HLCB0LCBkaXJlY3RpdmVJbmRleCwgYXN0LCBudWxsLCBudWxsLCBudWxsKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVGb3JIb3N0QXR0cmlidXRlKGRpcmVjdGl2ZUluZGV4OiBEaXJlY3RpdmVJbmRleCwgYXN0OiBBU1QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IHN0cmluZyk6IEJpbmRpbmdSZWNvcmQge1xuICAgIHZhciB0ID0gbmV3IEJpbmRpbmdUYXJnZXQoRUxFTUVOVF9BVFRSSUJVVEUsIGRpcmVjdGl2ZUluZGV4LmVsZW1lbnRJbmRleCwgYXR0cmlidXRlTmFtZSwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzdC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gbmV3IEJpbmRpbmdSZWNvcmQoQklORElORywgdCwgZGlyZWN0aXZlSW5kZXgsIGFzdCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlRm9ySG9zdENsYXNzKGRpcmVjdGl2ZUluZGV4OiBEaXJlY3RpdmVJbmRleCwgYXN0OiBBU1QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBzdHJpbmcpOiBCaW5kaW5nUmVjb3JkIHtcbiAgICB2YXIgdCA9IG5ldyBCaW5kaW5nVGFyZ2V0KEVMRU1FTlRfQ0xBU1MsIGRpcmVjdGl2ZUluZGV4LmVsZW1lbnRJbmRleCwgY2xhc3NOYW1lLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN0LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChCSU5ESU5HLCB0LCBkaXJlY3RpdmVJbmRleCwgYXN0LCBudWxsLCBudWxsLCBudWxsKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVGb3JIb3N0U3R5bGUoZGlyZWN0aXZlSW5kZXg6IERpcmVjdGl2ZUluZGV4LCBhc3Q6IEFTVCwgc3R5bGVOYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdDogc3RyaW5nKTogQmluZGluZ1JlY29yZCB7XG4gICAgdmFyIHQgPSBuZXcgQmluZGluZ1RhcmdldChFTEVNRU5UX1NUWUxFLCBkaXJlY3RpdmVJbmRleC5lbGVtZW50SW5kZXgsIHN0eWxlTmFtZSwgdW5pdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzdC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gbmV3IEJpbmRpbmdSZWNvcmQoQklORElORywgdCwgZGlyZWN0aXZlSW5kZXgsIGFzdCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIH1cblxuXG5cbiAgc3RhdGljIGNyZWF0ZUZvclRleHROb2RlKGFzdDogQVNULCBlbGVtZW50SW5kZXg6IG51bWJlcik6IEJpbmRpbmdSZWNvcmQge1xuICAgIHZhciB0ID0gbmV3IEJpbmRpbmdUYXJnZXQoVEVYVF9OT0RFLCBlbGVtZW50SW5kZXgsIG51bGwsIG51bGwsIGFzdC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gbmV3IEJpbmRpbmdSZWNvcmQoQklORElORywgdCwgMCwgYXN0LCBudWxsLCBudWxsLCBudWxsKTtcbiAgfVxuXG5cblxuICBzdGF0aWMgY3JlYXRlRm9yRXZlbnQoYXN0OiBBU1QsIGV2ZW50TmFtZTogc3RyaW5nLCBlbGVtZW50SW5kZXg6IG51bWJlcik6IEJpbmRpbmdSZWNvcmQge1xuICAgIHZhciB0ID0gbmV3IEJpbmRpbmdUYXJnZXQoRVZFTlQsIGVsZW1lbnRJbmRleCwgZXZlbnROYW1lLCBudWxsLCBhc3QudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIG5ldyBCaW5kaW5nUmVjb3JkKEVWRU5ULCB0LCAwLCBhc3QsIG51bGwsIG51bGwsIG51bGwpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUZvckhvc3RFdmVudChhc3Q6IEFTVCwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlUmVjb3JkOiBEaXJlY3RpdmVSZWNvcmQpOiBCaW5kaW5nUmVjb3JkIHtcbiAgICB2YXIgZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVSZWNvcmQuZGlyZWN0aXZlSW5kZXg7XG4gICAgdmFyIHQgPVxuICAgICAgICBuZXcgQmluZGluZ1RhcmdldChIT1NUX0VWRU5ULCBkaXJlY3RpdmVJbmRleC5lbGVtZW50SW5kZXgsIGV2ZW50TmFtZSwgbnVsbCwgYXN0LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBuZXcgQmluZGluZ1JlY29yZChIT1NUX0VWRU5ULCB0LCBkaXJlY3RpdmVJbmRleCwgYXN0LCBudWxsLCBudWxsLCBkaXJlY3RpdmVSZWNvcmQpO1xuICB9XG59XG4iXX0=