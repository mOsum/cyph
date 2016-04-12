import { Subscriber } from '../Subscriber';
import { Subscription } from '../Subscription';
import { tryCatch } from '../util/tryCatch';
import { errorObject } from '../util/errorObject';
/**
 * Buffers the source Observable values starting from an emission from
 * `openings` and ending when the output of `closingSelector` emits.
 *
 * <span class="informal">Collects values from the past as an array. Starts
 * collecting only when `opening` emits, and calls the `closingSelector`
 * function to get an Observable that tells when to close the buffer.</span>
 *
 * <img src="./img/bufferToggle.png" width="100%">
 *
 * Buffers values from the source by opening the buffer via signals from an
 * Observable provided to `openings`, and closing and sending the buffers when
 * an Observable returned by the `closingSelector` function emits.
 *
 * @example <caption>Every other second, emit the click events from the next 500ms</caption>
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var openings = Rx.Observable.interval(1000);
 * var buffered = clicks.bufferToggle(openings, i =>
 *   i % 2 ? Rx.Observable.interval(500) : Rx.Observable.empty()
 * );
 * buffered.subscribe(x => console.log(x));
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferWhen}
 * @see {@link windowToggle}
 *
 * @param {Observable<O>} openings An observable of notifications to start new
 * buffers.
 * @param {function(value: O): Observable} closingSelector A function that takes
 * the value emitted by the `openings` observable and returns an Observable,
 * which, when it emits, signals that the associated buffer should be emitted
 * and cleared.
 * @return {Observable<T[]>} An observable of arrays of buffered values.
 * @method bufferToggle
 * @owner Observable
 */
export function bufferToggle(openings, closingSelector) {
    return this.lift(new BufferToggleOperator(openings, closingSelector));
}
class BufferToggleOperator {
    constructor(openings, closingSelector) {
        this.openings = openings;
        this.closingSelector = closingSelector;
    }
    call(subscriber, source) {
        return source._subscribe(new BufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
    }
}
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class BufferToggleSubscriber extends Subscriber {
    constructor(destination, openings, closingSelector) {
        super(destination);
        this.openings = openings;
        this.closingSelector = closingSelector;
        this.contexts = [];
        this.add(this.openings.subscribe(new BufferToggleOpeningsSubscriber(this)));
    }
    _next(value) {
        const contexts = this.contexts;
        const len = contexts.length;
        for (let i = 0; i < len; i++) {
            contexts[i].buffer.push(value);
        }
    }
    _error(err) {
        const contexts = this.contexts;
        while (contexts.length > 0) {
            const context = contexts.shift();
            context.subscription.unsubscribe();
            context.buffer = null;
            context.subscription = null;
        }
        this.contexts = null;
        super._error(err);
    }
    _complete() {
        const contexts = this.contexts;
        while (contexts.length > 0) {
            const context = contexts.shift();
            this.destination.next(context.buffer);
            context.subscription.unsubscribe();
            context.buffer = null;
            context.subscription = null;
        }
        this.contexts = null;
        super._complete();
    }
    openBuffer(value) {
        const closingSelector = this.closingSelector;
        const contexts = this.contexts;
        let closingNotifier = tryCatch(closingSelector)(value);
        if (closingNotifier === errorObject) {
            this._error(errorObject.e);
        }
        else {
            let context = {
                buffer: [],
                subscription: new Subscription()
            };
            contexts.push(context);
            const subscriber = new BufferToggleClosingsSubscriber(this, context);
            const subscription = closingNotifier.subscribe(subscriber);
            context.subscription.add(subscription);
            this.add(subscription);
        }
    }
    closeBuffer(context) {
        const contexts = this.contexts;
        if (contexts === null) {
            return;
        }
        const { buffer, subscription } = context;
        this.destination.next(buffer);
        contexts.splice(contexts.indexOf(context), 1);
        this.remove(subscription);
        subscription.unsubscribe();
    }
}
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class BufferToggleOpeningsSubscriber extends Subscriber {
    constructor(parent) {
        super(null);
        this.parent = parent;
    }
    _next(value) {
        this.parent.openBuffer(value);
    }
    _error(err) {
        this.parent.error(err);
    }
    _complete() {
        // noop
    }
}
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class BufferToggleClosingsSubscriber extends Subscriber {
    constructor(parent, context) {
        super(null);
        this.parent = parent;
        this.context = context;
    }
    _next() {
        this.parent.closeBuffer(this.context);
    }
    _error(err) {
        this.parent.error(err);
    }
    _complete() {
        this.parent.closeBuffer(this.context);
    }
}
//# sourceMappingURL=bufferToggle.js.map