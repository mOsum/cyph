var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApplicationRef } from 'angular2/src/core/application_ref';
import { Injectable } from 'angular2/src/core/di';
/**
 * A no-op implementation of {@link ApplicationRef}, useful for testing.
 */
export let MockApplicationRef = class extends ApplicationRef {
    registerBootstrapListener(listener) { }
    registerDisposeListener(dispose) { }
    bootstrap(componentType, bindings) {
        return null;
    }
    get injector() { return null; }
    ;
    get zone() { return null; }
    ;
    dispose() { }
    tick() { }
    get componentTypes() { return null; }
    ;
};
MockApplicationRef = __decorate([
    Injectable(), 
    __metadata('design:paramtypes', [])
], MockApplicationRef);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19hcHBsaWNhdGlvbl9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLXczRFJsWEppLnRtcC9hbmd1bGFyMi9zcmMvbW9jay9tb2NrX2FwcGxpY2F0aW9uX3JlZi50cyJdLCJuYW1lcyI6WyJNb2NrQXBwbGljYXRpb25SZWYiLCJNb2NrQXBwbGljYXRpb25SZWYucmVnaXN0ZXJCb290c3RyYXBMaXN0ZW5lciIsIk1vY2tBcHBsaWNhdGlvblJlZi5yZWdpc3RlckRpc3Bvc2VMaXN0ZW5lciIsIk1vY2tBcHBsaWNhdGlvblJlZi5ib290c3RyYXAiLCJNb2NrQXBwbGljYXRpb25SZWYuaW5qZWN0b3IiLCJNb2NrQXBwbGljYXRpb25SZWYuem9uZSIsIk1vY2tBcHBsaWNhdGlvblJlZi5kaXNwb3NlIiwiTW9ja0FwcGxpY2F0aW9uUmVmLnRpY2siLCJNb2NrQXBwbGljYXRpb25SZWYuY29tcG9uZW50VHlwZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DO09BQ3pELEVBQUMsVUFBVSxFQUFDLE1BQU0sc0JBQXNCO0FBTS9DOztHQUVHO0FBQ0gsOENBQ3dDLGNBQWM7SUFDcERBLHlCQUF5QkEsQ0FBQ0EsUUFBcUNBLElBQVNDLENBQUNBO0lBRXpFRCx1QkFBdUJBLENBQUNBLE9BQW1CQSxJQUFTRSxDQUFDQTtJQUVyREYsU0FBU0EsQ0FBQ0EsYUFBbUJBLEVBQUVBLFFBQXFDQTtRQUNsRUcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFREgsSUFBSUEsUUFBUUEsS0FBZUksTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7O0lBRXpDSixJQUFJQSxJQUFJQSxLQUFhSyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTs7SUFFbkNMLE9BQU9BLEtBQVVNLENBQUNBO0lBRWxCTixJQUFJQSxLQUFVTyxDQUFDQTtJQUVmUCxJQUFJQSxjQUFjQSxLQUFhUSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTs7QUFDL0NSLENBQUNBO0FBbkJEO0lBQUMsVUFBVSxFQUFFOzt1QkFtQlo7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2RpJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7Q29tcG9uZW50UmVmfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvZHluYW1pY19jb21wb25lbnRfbG9hZGVyJztcbmltcG9ydCB7UHJvdmlkZXIsIEluamVjdG9yfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9kaSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvem9uZS9uZ196b25lJztcblxuLyoqXG4gKiBBIG5vLW9wIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayBBcHBsaWNhdGlvblJlZn0sIHVzZWZ1bCBmb3IgdGVzdGluZy5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vY2tBcHBsaWNhdGlvblJlZiBleHRlbmRzIEFwcGxpY2F0aW9uUmVmIHtcbiAgcmVnaXN0ZXJCb290c3RyYXBMaXN0ZW5lcihsaXN0ZW5lcjogKHJlZjogQ29tcG9uZW50UmVmKSA9PiB2b2lkKTogdm9pZCB7fVxuXG4gIHJlZ2lzdGVyRGlzcG9zZUxpc3RlbmVyKGRpc3Bvc2U6ICgpID0+IHZvaWQpOiB2b2lkIHt9XG5cbiAgYm9vdHN0cmFwKGNvbXBvbmVudFR5cGU6IFR5cGUsIGJpbmRpbmdzPzogQXJyYXk8VHlwZXxQcm92aWRlcnxhbnlbXT4pOiBQcm9taXNlPENvbXBvbmVudFJlZj4ge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIG51bGw7IH07XG5cbiAgZ2V0IHpvbmUoKTogTmdab25lIHsgcmV0dXJuIG51bGw7IH07XG5cbiAgZGlzcG9zZSgpOiB2b2lkIHt9XG5cbiAgdGljaygpOiB2b2lkIHt9XG5cbiAgZ2V0IGNvbXBvbmVudFR5cGVzKCk6IFR5cGVbXSB7IHJldHVybiBudWxsOyB9O1xufVxuIl19