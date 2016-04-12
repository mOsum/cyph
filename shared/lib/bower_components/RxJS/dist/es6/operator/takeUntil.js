import { OuterSubscriber } from '../OuterSubscriber';
import { subscribeToResult } from '../util/subscribeToResult';
/**
 * @param notifier
 * @return {Observable<R>|WebSocketSubject<T>|Observable<T>}
 * @method takeUntil
 * @owner Observable
 */
export function takeUntil(notifier) {
    return this.lift(new TakeUntilOperator(notifier));
}
class TakeUntilOperator {
    constructor(notifier) {
        this.notifier = notifier;
    }
    call(subscriber, source) {
        return source._subscribe(new TakeUntilSubscriber(subscriber, this.notifier));
    }
}
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class TakeUntilSubscriber extends OuterSubscriber {
    constructor(destination, notifier) {
        super(destination);
        this.notifier = notifier;
        this.add(subscribeToResult(this, notifier));
    }
    notifyNext(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
        this.complete();
    }
    notifyComplete() {
        // noop
    }
}
//# sourceMappingURL=takeUntil.js.map