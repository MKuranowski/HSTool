// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { type SignalOptions } from "@preact/signals-core";
import { Signal } from "@preact/signals-react";

/** Signal that holds an array. Any modifications cause the signal to trigger. */
export class ArraySignal<T> extends Signal<ReadonlyArray<T>> {
    constructor(value?: ReadonlyArray<T>, options?: SignalOptions<ReadonlyArray<T>>) {
        super(value ?? [], options);
    }

    pop(): T | undefined {
        const last = this.value.at(-1);
        this.value = this.value.slice(0, -1);
        return last;
    }

    push(...elements: T[]): void {
        this.value = this.value.concat(elements);
    }

    reverse(): void {
        this.value = this.value.toReversed();
    }

    shift(): T | undefined {
        const first = this.value.at(0);
        this.value = this.value.slice(1);
        return first;
    }

    sort(compareFn?: (a: T, b: T) => number): void {
        this.value = this.value.toSorted(compareFn);
    }

    splice(start: number, deleteCount?: number, ...items: T[]): T[] {
        deleteCount ??= 0;
        const removed = this.value.slice(start, start + deleteCount);
        this.value = this.value.toSpliced(start, deleteCount, ...items);
        return removed;
    }

    unshift(...elements: T[]): void {
        this.value = elements.concat(this.value);
    }
}

/** Signal that holds a Set. Any modifications cause the signal to trigger. */
export class SetSignal<T> extends Signal<ReadonlySet<T>> {
    constructor(value?: ReadonlySet<T>, options?: SignalOptions<ReadonlySet<T>>) {
        super(value ?? new Set(), options);
    }

    add(value: T): this {
        if (!this.value.has(value)) {
            const copy = new Set(this.value);
            copy.add(value);
            this.value = copy;
        }
        return this;
    }

    clear(): void {
        if (this.value.size != 0) {
            this.value = new Set();
        }
    }

    delete(value: T): boolean {
        if (this.value.has(value)) {
            const copy = new Set(this.value);
            copy.delete(value);
            this.value = copy;
            return true;
        } else {
            return false;
        }
    }
}

/** Signal that holds a Map. Any modifications cause the signal to trigger. */
export class MapSignal<K, V> extends Signal<ReadonlyMap<K, V>> {
    constructor(value?: ReadonlyMap<K, V>, options?: SignalOptions<ReadonlyMap<K, V>>) {
        super(value ?? new Map(), options);
    }

    clear(): void {
        if (this.value.size != 0) {
            this.value = new Map();
        }
    }

    delete(key: K): boolean {
        if (this.value.has(key)) {
            const copy = new Map(this.value);
            copy.delete(key);
            this.value = copy;
            return true;
        } else {
            return false;
        }
    }

    getOrInsert(key: K, defaultValue: V): V {
        if (this.value.has(key)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.value.get(key)!;
        }
        const copy = new Map(this.value);
        copy.set(key, defaultValue);
        this.value = copy;
        return defaultValue;
    }

    getOrInsertComputed(key: K, callback: (key: K) => V): V {
        if (this.value.has(key)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.value.get(key)!;
        }
        const copy = new Map(this.value);
        const value = callback(key);
        copy.set(key, value);
        this.value = copy;
        return value;
    }

    set(key: K, value: V): this {
        const copy = new Map(this.value);
        copy.set(key, value);
        this.value = copy;
        return this;
    }
}
