// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

export function* map<T, U>(it: Iterable<T>, f: (elem: T) => U): Generator<U> {
    for (const elem of it) yield f(elem);
}

export function* filter<T>(it: Iterable<T>, keep: (elem: T) => boolean): Generator<T> {
    for (const elem of it) {
        if (keep(elem)) yield elem;
    }
}

export function* filterMap<T, U>(it: Iterable<T>, f: (elem: T) => U | undefined): Generator<U> {
    for (const elem of it) {
        const mapped = f(elem);
        if (mapped !== undefined) yield mapped;
    }
}

export function* enumerate<T>(it: Iterable<T>, start: number = 0): Generator<[number, T]> {
    for (const elem of it) yield [start++, elem];
}
