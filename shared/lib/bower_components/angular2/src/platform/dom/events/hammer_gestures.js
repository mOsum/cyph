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
var hammer_common_1 = require('./hammer_common');
var lang_1 = require('angular2/src/facade/lang');
var exceptions_1 = require('angular2/src/facade/exceptions');
var core_1 = require('angular2/core');
exports.HAMMER_GESTURE_CONFIG = lang_1.CONST_EXPR(new core_1.OpaqueToken('HammerGestureConfig'));
var HammerGestureConfig = (function () {
    function HammerGestureConfig() {
        this.events = [];
        this.overrides = {};
    }
    HammerGestureConfig.prototype.buildHammer = function (element) {
        var mc = new Hammer(element);
        mc.get('pinch').set({ enable: true });
        mc.get('rotate').set({ enable: true });
        for (var eventName in this.overrides) {
            mc.get(eventName).set(this.overrides[eventName]);
        }
        return mc;
    };
    HammerGestureConfig = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [])
    ], HammerGestureConfig);
    return HammerGestureConfig;
})();
exports.HammerGestureConfig = HammerGestureConfig;
var HammerGesturesPlugin = (function (_super) {
    __extends(HammerGesturesPlugin, _super);
    function HammerGesturesPlugin(_config) {
        _super.call(this);
        this._config = _config;
    }
    HammerGesturesPlugin.prototype.supports = function (eventName) {
        if (!_super.prototype.supports.call(this, eventName) && !this.isCustomEvent(eventName))
            return false;
        if (!lang_1.isPresent(window['Hammer'])) {
            throw new exceptions_1.BaseException("Hammer.js is not loaded, can not bind " + eventName + " event");
        }
        return true;
    };
    HammerGesturesPlugin.prototype.addEventListener = function (element, eventName, handler) {
        var _this = this;
        var zone = this.manager.getZone();
        eventName = eventName.toLowerCase();
        return zone.runOutsideAngular(function () {
            // Creating the manager bind events, must be done outside of angular
            var mc = _this._config.buildHammer(element);
            var callback = function (eventObj) { zone.run(function () { handler(eventObj); }); };
            mc.on(eventName, callback);
            return function () { mc.off(eventName, callback); };
        });
    };
    HammerGesturesPlugin.prototype.isCustomEvent = function (eventName) { return this._config.events.indexOf(eventName) > -1; };
    HammerGesturesPlugin = __decorate([
        core_1.Injectable(),
        __param(0, core_1.Inject(exports.HAMMER_GESTURE_CONFIG)), 
        __metadata('design:paramtypes', [HammerGestureConfig])
    ], HammerGesturesPlugin);
    return HammerGesturesPlugin;
})(hammer_common_1.HammerGesturesPluginCommon);
exports.HammerGesturesPlugin = HammerGesturesPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFtbWVyX2dlc3R1cmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1Qdk91Ump2eC50bXAvYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9ldmVudHMvaGFtbWVyX2dlc3R1cmVzLnRzIl0sIm5hbWVzIjpbIkhhbW1lckdlc3R1cmVDb25maWciLCJIYW1tZXJHZXN0dXJlQ29uZmlnLmNvbnN0cnVjdG9yIiwiSGFtbWVyR2VzdHVyZUNvbmZpZy5idWlsZEhhbW1lciIsIkhhbW1lckdlc3R1cmVzUGx1Z2luIiwiSGFtbWVyR2VzdHVyZXNQbHVnaW4uY29uc3RydWN0b3IiLCJIYW1tZXJHZXN0dXJlc1BsdWdpbi5zdXBwb3J0cyIsIkhhbW1lckdlc3R1cmVzUGx1Z2luLmFkZEV2ZW50TGlzdGVuZXIiLCJIYW1tZXJHZXN0dXJlc1BsdWdpbi5pc0N1c3RvbUV2ZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhCQUF5QyxpQkFBaUIsQ0FBQyxDQUFBO0FBQzNELHFCQUFvQywwQkFBMEIsQ0FBQyxDQUFBO0FBQy9ELDJCQUE4QyxnQ0FBZ0MsQ0FBQyxDQUFBO0FBQy9FLHFCQUE4QyxlQUFlLENBQUMsQ0FBQTtBQUVqRCw2QkFBcUIsR0FDOUIsaUJBQVUsQ0FBQyxJQUFJLGtCQUFXLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0FBT3ZEO0lBQUFBO1FBRUVDLFdBQU1BLEdBQWFBLEVBQUVBLENBQUNBO1FBRXRCQSxjQUFTQSxHQUE0QkEsRUFBRUEsQ0FBQ0E7SUFjMUNBLENBQUNBO0lBWkNELHlDQUFXQSxHQUFYQSxVQUFZQSxPQUFvQkE7UUFDOUJFLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBRTdCQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFDQSxN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QUFVQSxFQUFFQTtRQUVDQSxXQUFDQSxhQUFNQSxDQUFDQSw2QkFBcUJBLENBQUNBLENBQUFBOzs2QkEwQjNDQTtJQUFEQSwyQkFBQ0E7QUFBREEsQ0FBQ0EsQUE1QkQsRUFDMEMsMENBQTBCLEVBMkJuRTtBQTNCWSw0QkFBb0IsdUJBMkJoQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtIYW1tZXJHZXN0dXJlc1BsdWdpbkNvbW1vbn0gZnJvbSAnLi9oYW1tZXJfY29tbW9uJztcbmltcG9ydCB7aXNQcmVzZW50LCBDT05TVF9FWFBSfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuaW1wb3J0IHtCYXNlRXhjZXB0aW9uLCBXcmFwcGVkRXhjZXB0aW9ufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2V4Y2VwdGlvbnMnO1xuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE9wYXF1ZVRva2VufSBmcm9tICdhbmd1bGFyMi9jb3JlJztcblxuZXhwb3J0IGNvbnN0IEhBTU1FUl9HRVNUVVJFX0NPTkZJRzogT3BhcXVlVG9rZW4gPVxuICAgIENPTlNUX0VYUFIobmV3IE9wYXF1ZVRva2VuKCdIYW1tZXJHZXN0dXJlQ29uZmlnJykpO1xuXG5leHBvcnQgaW50ZXJmYWNlIEhhbW1lckluc3RhbmNlIHtcbiAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQ7XG4gIG9mZihldmVudE5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZDtcbn1cblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEhhbW1lckdlc3R1cmVDb25maWcge1xuICBldmVudHM6IHN0cmluZ1tdID0gW107XG5cbiAgb3ZlcnJpZGVzOiB7W2tleTogc3RyaW5nXTogT2JqZWN0fSA9IHt9O1xuXG4gIGJ1aWxkSGFtbWVyKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogSGFtbWVySW5zdGFuY2Uge1xuICAgIHZhciBtYyA9IG5ldyBIYW1tZXIoZWxlbWVudCk7XG5cbiAgICBtYy5nZXQoJ3BpbmNoJykuc2V0KHtlbmFibGU6IHRydWV9KTtcbiAgICBtYy5nZXQoJ3JvdGF0ZScpLnNldCh7ZW5hYmxlOiB0cnVlfSk7XG5cbiAgICBmb3IgKGxldCBldmVudE5hbWUgaW4gdGhpcy5vdmVycmlkZXMpIHtcbiAgICAgIG1jLmdldChldmVudE5hbWUpLnNldCh0aGlzLm92ZXJyaWRlc1tldmVudE5hbWVdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWM7XG4gIH1cbn1cblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEhhbW1lckdlc3R1cmVzUGx1Z2luIGV4dGVuZHMgSGFtbWVyR2VzdHVyZXNQbHVnaW5Db21tb24ge1xuICBjb25zdHJ1Y3RvcihASW5qZWN0KEhBTU1FUl9HRVNUVVJFX0NPTkZJRykgcHJpdmF0ZSBfY29uZmlnOiBIYW1tZXJHZXN0dXJlQ29uZmlnKSB7IHN1cGVyKCk7IH1cblxuICBzdXBwb3J0cyhldmVudE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghc3VwZXIuc3VwcG9ydHMoZXZlbnROYW1lKSAmJiAhdGhpcy5pc0N1c3RvbUV2ZW50KGV2ZW50TmFtZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICghaXNQcmVzZW50KHdpbmRvd1snSGFtbWVyJ10pKSB7XG4gICAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgSGFtbWVyLmpzIGlzIG5vdCBsb2FkZWQsIGNhbiBub3QgYmluZCAke2V2ZW50TmFtZX0gZXZlbnRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXIoZWxlbWVudDogSFRNTEVsZW1lbnQsIGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEZ1bmN0aW9uIHtcbiAgICB2YXIgem9uZSA9IHRoaXMubWFuYWdlci5nZXRab25lKCk7XG4gICAgZXZlbnROYW1lID0gZXZlbnROYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICByZXR1cm4gem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAvLyBDcmVhdGluZyB0aGUgbWFuYWdlciBiaW5kIGV2ZW50cywgbXVzdCBiZSBkb25lIG91dHNpZGUgb2YgYW5ndWxhclxuICAgICAgdmFyIG1jID0gdGhpcy5fY29uZmlnLmJ1aWxkSGFtbWVyKGVsZW1lbnQpO1xuICAgICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZXZlbnRPYmopIHsgem9uZS5ydW4oZnVuY3Rpb24oKSB7IGhhbmRsZXIoZXZlbnRPYmopOyB9KTsgfTtcbiAgICAgIG1jLm9uKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICAgICAgcmV0dXJuICgpID0+IHsgbWMub2ZmKGV2ZW50TmFtZSwgY2FsbGJhY2spOyB9O1xuICAgIH0pO1xuICB9XG5cbiAgaXNDdXN0b21FdmVudChldmVudE5hbWU6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fY29uZmlnLmV2ZW50cy5pbmRleE9mKGV2ZW50TmFtZSkgPiAtMTsgfVxufVxuIl19