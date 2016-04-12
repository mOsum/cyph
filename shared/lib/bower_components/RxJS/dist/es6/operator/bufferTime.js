import { Subscriber } from '../Subscriber';
import { async } from '../scheduler/async';
/**
 * Buffers the source Observable values for a specific time period.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * those arrays periodically in time.</span>
 *
 * <img src="./img/bufferTime.png" width="100%">
 *
 * Buffers values from the source for a specific time duration `bufferTimeSpan`.
 * Unless the optional argument `bufferCreationInterval` is given, it emits and
 * resets the buffer every `bufferTimeSpan` milliseconds. If
 * `bufferCreationInterval` is given, this operator opens the buffer every
 * `bufferCreationInterval` milliseconds and closes (emits and resets) the
 * buffer every `bufferTimeSpan` milliseconds.
 *
 * @example <caption>Every second, emit an array of the recent click events</caption>
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var buffered = clicks.bufferTime(1000);
 * buffered.subscribe(x => console.log(x));
 *
 * @example <caption>Every 5 seconds, emit the click events from the next 2 seconds</caption>
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var buffered = clicks.bufferTime(2000, 5000);
 * buffered.subscribe(x => console.log(x));
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link windowTime}
 *
 * @param {number} bufferTimeSpan The amount of time to fill each buffer array.
 * @param {number} [bufferCreationInterval] The interval at which to start new
 * buffers.
 * @param {Scheduler} [scheduler=async] The scheduler on which to schedule the
 * intervals that determine buffer boundaries.
 * @return {Observable<T[]>} An observable of arrays of buffered values.
 * @method bufferTime
 * @owner Observable
 */
export function bufferTime(bufferTimeSpan, bufferCreationInterval = null, scheduler = async) {
    return this.lift(new BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, scheduler));
}
class BufferTimeOperator {
    constructor(bufferTimeSpan, bufferCreationInterval, scheduler) {
        this.bufferTimeSpan = bufferTimeSpan;
        this.bufferCreationInterval = bufferCreationInterval;
        this.scheduler = scheduler;
    }
    call(subscriber, source) {
        return source._subscribe(new BufferTimeSubscriber(subscriber, this.bufferTimeSpan, this.bufferCreationInterval, this.scheduler));
    }
}
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class BufferTimeSubscriber extends Subscriber {
    constructor(destination, bufferTimeSpan, bufferCreationInterval, scheduler) {
        super(destination);
        this.bufferTimeSpan = bufferTimeSpan;
        this.bufferCreationInterval = bufferCreationInterval;
        this.scheduler = scheduler;
        this.buffers = [];
        const buffer = this.openBuffer();
        if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
            const closeState = { subscriber: this, buffer };
            const creationState = { bufferTimeSpan, bufferCreationInterval, subscriber: this, scheduler };
            this.add(scheduler.schedule(dispatchBufferClose, bufferTimeSpan, closeState));
            this.add(scheduler.schedule(dispatchBufferCreation, bufferCreationInterval, creationState));
        }
        else {
            const timeSpanOnlyState = { subscriber: this, buffer, bufferTimeSpan };
            this.add(scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
        }
    }
    _next(value) {
        const buffers = this.buffers;
        const len = buffers.length;
        for (let i = 0; i < len; i++) {
            buffers[i].push(value);
        }
    }
    _error(err) {
        this.buffers.length = 0;
        super._error(err);
    }
    _complete() {
        const { buffers, destination } = this;
        while (buffers.length > 0) {
            destination.next(buffers.shift());
        }
        super._complete();
    }
    _unsubscribe() {
        this.buffers = null;
    }
    openBuffer() {
        let buffer = [];
        this.buffers.push(buffer);
        return buffer;
    }
    closeBuffer(buffer) {
        this.destination.next(buffer);
        const buffers = this.buffers;
        buffers.splice(buffers.indexOf(buffer), 1);
    }
}
function dispatchBufferTimeSpanOnly(state) {
    const subscriber = state.subscriber;
    const prevBuffer = state.buffer;
    if (prevBuffer) {
        subscriber.closeBuffer(prevBuffer);
    }
    state.buffer = subscriber.openBuffer();
    if (!subscriber.isUnsubscribed) {
        this.schedule(state, state.bufferTimeSpan);
    }
}
function dispatchBufferCreation(state) {
    const { bufferCreationInterval, bufferTimeSpan, subscriber, scheduler } = state;
    const buffer = subscriber.openBuffer();
    const action = this;
    if (!subscriber.isUnsubscribed) {
        action.add(scheduler.schedule(dispatchBufferClose, bufferTimeSpan, { subscriber, buffer }));
        action.schedule(state, bufferCreationInterval);
    }
}
function dispatchBufferClose({ subscriber, buffer }) {
    subscriber.closeBuffer(buffer);
}
//# sourceMappingURL=bufferTime.js.map