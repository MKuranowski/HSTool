// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Utility module for treating `Record<string, undefined>` as immutable `Set<string>`,
 * for storage in nanostore's atoms.
 *
 * @module record
 */

/**
 * Add returns a copy of `base` with all `keys` added.
 */
export function add(base: Record<string, undefined>, ...keys: string[]): Record<string, undefined> {
    const n = { ...base };
    for (const key of keys) n[key] = undefined;
    return n;
}

/**
 * Remove returns a copy of `base` with all `keys` removed.
 */
export function remove(
    base: Record<string, undefined>,
    ...keys: string[]
): Record<string, undefined> {
    const n = { ...base };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    for (const key of keys) delete n[key];
    return n;
}

/**
 * New returns a new `Record<string, undefined>` with the provided `keys`.
 */
export function new_(...keys: string[]): Record<string, undefined> {
    return add({}, ...keys);
}

/**
 * Union returns a new `Record<string, undefined>` with keys from all provided `records`.
 */
export function union(...records: Record<string, undefined>[]): Record<string, undefined> {
    const n = {};
    Object.assign(n, ...records);
    return n;
}

/**
 * Length returns the number of keys in the `record`.
 */
export function length(base: Record<string | number | symbol, unknown>): number {
    return Object.keys(base).length;
}

/**
 * Iter returns an array of all keys in the `record`.
 */
export function iter(record: Record<string, unknown>): string[] {
    return Object.keys(record);
}

/**
 * Contains returns true if the provided `key` exists in the `record`.
 */
export function contains<T extends string | number | symbol>(
    record: Record<T, unknown>,
    key: T,
): boolean {
    return Object.hasOwn(record, key);
}
