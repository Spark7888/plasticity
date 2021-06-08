/**
 * The classes here represent promise-like object that can be cancelled or "finished" earlier than it would normally
 * terminate. For example, a promise that resolves when a user drags a gizmo from point a to b can be canceled by
 * the user hitting ESCAPE. It might be finished by hitting ENTER.
 * 
 * All cancellable objects should be "registered" meaning that if multiple cancellable promises are simultaneously
 * running, the Registor can cancel them all.
 */

import { Disposable } from "event-kit";

export abstract class Cancellable {
    abstract cancel(): void;
    abstract finish(): void;

    resource(reg: CancellableRegistor): this {
        reg.resource(this);
        return this;
    }

    finally(reg: CancellableRegistor): this {
        reg.finally(this);
        return this;
    }
}

export class CancellableDisposable extends Cancellable {
    constructor(private readonly disposable: Disposable) {
        super();
    }

    cancel() {
        this.disposable.dispose();
    }

    finish() {
        this.cancel();
    }
}

export const Cancel = { tag: 'Cancel' };
export const Finish = { tag: 'Finish' };

type Executor<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => { cancel: (() => void), finish: (() => void) };

export abstract class CancellableRegistor {
    private readonly resources: Cancellable[] = [];
    private _finally?: Cancellable;

    cancel(): void {
        for (const resource of this.resources) {
            resource.cancel();
        }
        this._finally?.cancel();
    }

    finish(): void {
        this._finally?.finish();
        for (const resource of this.resources) {
            resource.cancel();
        }
    }

    resource<T extends Cancellable>(x: T): T {
        this.resources.push(x);
        return x
    }

    finally<T extends Cancellable>(x: T): T {
        this._finally = x;
        return x;
    }
}

export class CancellablePromise<T> extends Cancellable {
    cancel!: () => void;
    finish!: () => void;
    executor: Executor<T>;

    constructor(executor: Executor<T>) {
        super();
        this.executor = executor;
    }

    then(resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void): void {
        const { cancel, finish } = this.executor(resolve, reject);
        this.cancel = cancel;
        this.finish = finish;
    }
}
