define(["require", "exports", './Subject', './Observable', './Operator', './Subscription', './Subscriber', './AsyncSubject', './ReplaySubject', './BehaviorSubject', './observable/ConnectableObservable', './Notification', './util/EmptyError', './util/ArgumentOutOfRangeError', './util/ObjectUnsubscribedError', './scheduler/asap', './scheduler/async', './scheduler/queue', './symbol/rxSubscriber', './symbol/observable', './symbol/iterator', './add/observable/bindCallback', './add/observable/bindNodeCallback', './add/observable/combineLatest', './add/observable/concat', './add/observable/defer', './add/observable/empty', './add/observable/forkJoin', './add/observable/from', './add/observable/fromEvent', './add/observable/fromEventPattern', './add/observable/fromPromise', './add/observable/interval', './add/observable/merge', './add/observable/race', './add/observable/never', './add/observable/of', './add/observable/range', './add/observable/throw', './add/observable/timer', './add/observable/zip', './add/operator/buffer', './add/operator/bufferCount', './add/operator/bufferTime', './add/operator/bufferToggle', './add/operator/bufferWhen', './add/operator/cache', './add/operator/catch', './add/operator/combineAll', './add/operator/combineLatest', './add/operator/concat', './add/operator/concatAll', './add/operator/concatMap', './add/operator/concatMapTo', './add/operator/count', './add/operator/dematerialize', './add/operator/debounce', './add/operator/debounceTime', './add/operator/defaultIfEmpty', './add/operator/delay', './add/operator/delayWhen', './add/operator/distinctUntilChanged', './add/operator/do', './add/operator/expand', './add/operator/filter', './add/operator/finally', './add/operator/first', './add/operator/groupBy', './add/operator/ignoreElements', './add/operator/audit', './add/operator/auditTime', './add/operator/last', './add/operator/let', './add/operator/every', './add/operator/map', './add/operator/mapTo', './add/operator/materialize', './add/operator/merge', './add/operator/mergeAll', './add/operator/mergeMap', './add/operator/mergeMapTo', './add/operator/multicast', './add/operator/observeOn', './add/operator/partition', './add/operator/pluck', './add/operator/publish', './add/operator/publishBehavior', './add/operator/publishReplay', './add/operator/publishLast', './add/operator/race', './add/operator/reduce', './add/operator/repeat', './add/operator/retry', './add/operator/retryWhen', './add/operator/sample', './add/operator/sampleTime', './add/operator/scan', './add/operator/share', './add/operator/single', './add/operator/skip', './add/operator/skipUntil', './add/operator/skipWhile', './add/operator/startWith', './add/operator/subscribeOn', './add/operator/switch', './add/operator/switchMap', './add/operator/switchMapTo', './add/operator/take', './add/operator/takeLast', './add/operator/takeUntil', './add/operator/takeWhile', './add/operator/throttle', './add/operator/throttleTime', './add/operator/timeout', './add/operator/timeoutWith', './add/operator/toArray', './add/operator/toPromise', './add/operator/window', './add/operator/windowCount', './add/operator/windowTime', './add/operator/windowToggle', './add/operator/windowWhen', './add/operator/withLatestFrom', './add/operator/zip', './add/operator/zipAll'], function (require, exports, Subject_1, Observable_1, Operator_1, Subscription_1, Subscriber_1, AsyncSubject_1, ReplaySubject_1, BehaviorSubject_1, ConnectableObservable_1, Notification_1, EmptyError_1, ArgumentOutOfRangeError_1, ObjectUnsubscribedError_1, asap_1, async_1, queue_1, rxSubscriber_1, observable_1, iterator_1) {
    "use strict";
    /* tslint:disable:no-unused-variable */
    // Subject imported before Observable to bypass circular dependency issue since
    // Subject extends Observable and Observable references Subject in it's
    // definition
    exports.Subject = Subject_1.Subject;
    /* tslint:enable:no-unused-variable */
    exports.Observable = Observable_1.Observable;
    /* tslint:disable:no-unused-variable */
    exports.Operator = Operator_1.Operator;
    exports.Subscription = Subscription_1.Subscription;
    exports.UnsubscriptionError = Subscription_1.UnsubscriptionError;
    exports.Subscriber = Subscriber_1.Subscriber;
    exports.AsyncSubject = AsyncSubject_1.AsyncSubject;
    exports.ReplaySubject = ReplaySubject_1.ReplaySubject;
    exports.BehaviorSubject = BehaviorSubject_1.BehaviorSubject;
    exports.ConnectableObservable = ConnectableObservable_1.ConnectableObservable;
    exports.Notification = Notification_1.Notification;
    exports.EmptyError = EmptyError_1.EmptyError;
    exports.ArgumentOutOfRangeError = ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
    exports.ObjectUnsubscribedError = ObjectUnsubscribedError_1.ObjectUnsubscribedError;
    /* tslint:enable:no-unused-variable */
    /**
     * @typedef {Object} Rx.Scheduler
     * @property {Scheduler} queue Schedules on a queue in the current event frame
     * (trampoline scheduler). Use this for iteration operations.
     * @property {Scheduler} asap Schedules on the micro task queue, which uses the
     * fastest transport mechanism available, either Node.js' `process.nextTick()`
     * or Web Worker MessageChannel or setTimeout or others. Use this for
     * asynchronous conversions.
     * @property {Scheduler} async Schedules work with `setInterval`. Use this for
     * time-based operations.
     */
    var Scheduler = {
        asap: asap_1.asap,
        async: async_1.async,
        queue: queue_1.queue
    };
    exports.Scheduler = Scheduler;
    /**
     * @typedef {Object} Rx.Symbol
     * @property {Symbol|string} rxSubscriber A symbol to use as a property name to
     * retrieve an "Rx safe" Observer from an object. "Rx safety" can be defined as
     * an object that has all of the traits of an Rx Subscriber, including the
     * ability to add and remove subscriptions to the subscription chain and
     * guarantees involving event triggering (can't "next" after unsubscription,
     * etc).
     * @property {Symbol|string} observable A symbol to use as a property name to
     * retrieve an Observable as defined by the [ECMAScript "Observable" spec](https://github.com/zenparsing/es-observable).
     * @property {Symbol|string} iterator The ES6 symbol to use as a property name
     * to retrieve an iterator from an object.
     */
    var Symbol = {
        rxSubscriber: rxSubscriber_1.$$rxSubscriber,
        observable: observable_1.$$observable,
        iterator: iterator_1.$$iterator
    };
    exports.Symbol = Symbol;
});
//# sourceMappingURL=Rx.js.map