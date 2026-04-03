// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

export function add(base: Record<string, undefined>, ...keys: string[]): Record<string, undefined> {
    const n = { ...base };
    for (const key of keys) n[key] = undefined;
    return n;
}

export function remove(
    base: Record<string, undefined>,
    ...keys: string[]
): Record<string, undefined> {
    const n = { ...base };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    for (const key of keys) delete n[key];
    return n;
}

export function new_(...keys: string[]): Record<string, undefined> {
    return add({}, ...keys);
}

export function union(...records: Record<string, undefined>[]): Record<string, undefined> {
    const n = {};
    Object.assign(n, ...records);
    return n;
}

export function length(base: Record<string, undefined>): number {
    return Object.keys(base).length;
}

export function iter(base: Record<string, undefined>): string[] {
    return Object.keys(base);
}

export function contains(base: Record<string, undefined>, key: string): boolean {
    return Object.hasOwn(base, key);
}
