// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { persistentAtom, type PersistentSimpleOptions } from "@nanostores/persistent";
import { type WritableAtom } from "nanostores";
import * as z from "zod";

export interface ArrayAtom<T> extends WritableAtom<T[]> {
    pop(): T | undefined;
    push(...elements: T[]): void;
    shift(): T | undefined;
    unshift(...elements: T[]): void;

    splice(start: number, deleteCount: number, ...replacements: T[]): void;
    replace(at: number, replacement: T): void;
    remove(index: number): T | undefined;
}

export function arrayAtom<T>(atom: WritableAtom<T[]>): ArrayAtom<T> {
    const copy: ArrayAtom<T> = {
        ...atom,

        pop() {
            const arr = atom.get();
            atom.set(arr.toSpliced(arr.length - 1, 1));
            return arr.at(-1);
        },

        push(...elements) {
            const arr = atom.get();
            atom.set(arr.toSpliced(arr.length, 0, ...elements));
        },

        shift() {
            const arr = atom.get();
            atom.set(arr.toSpliced(0, 1));
            return arr.at(0);
        },

        unshift(...elements) {
            atom.set(atom.get().toSpliced(0, 0, ...elements));
        },

        remove(index) {
            const arr = atom.get();
            atom.set(arr.toSpliced(index, 1));
            return arr.at(index);
        },

        splice(start, deleteCount, ...replacements) {
            atom.set(atom.get().toSpliced(start, deleteCount, ...replacements));
        },

        replace(at, replacement) {
            atom.set(atom.get().toSpliced(at, 1, replacement));
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.setPrototypeOf(copy, Object.getPrototypeOf(atom));
    return copy;
}

export interface SetAtom extends WritableAtom<Record<string, 1>> {
    add(...keys: string[]): void;
    remove(...keys: string[]): void;
}

export function setAtom(atom: WritableAtom<Record<string, 1>>): SetAtom {
    const copy: SetAtom = {
        ...atom,

        add(...keys) {
            const obj = { ...atom.get() };
            keys.forEach((k) => (obj[k] = 1));
            atom.set(obj);
        },

        remove(...keys) {
            const obj = { ...atom.get() };
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            keys.forEach((k) => delete obj[k]);
            atom.set(obj);
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.setPrototypeOf(copy, Object.getPrototypeOf(atom));
    return copy;
}

export function persistentZod<T extends z.ZodType>(
    name: string,
    schema: T,
    initial: z.infer<T>,
    opts?: PersistentSimpleOptions,
): WritableAtom<z.infer<T>> {
    const jsonSchema = zodJson(schema);
    return persistentAtom(name, initial, {
        ...opts,
        encode: jsonSchema.encode.bind(jsonSchema),
        decode: jsonSchema.decode.bind(jsonSchema),
    });
}

/**
 * Creates a [zod Codec](https://zod.dev/codecs) that converts between JSON strings
 * and the provided schema.
 */
export function zodJson<T extends z.ZodType>(schema: T): z.ZodCodec<z.ZodString, T> {
    return z.codec(z.string(), schema, {
        decode(value, ctx) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(value);
            } catch (err) {
                ctx.issues.push({
                    code: "invalid_format",
                    format: "json",
                    input: value,
                    // @ts-expect-error "message" does not exist on {}, duh, that's what `?.` is for
                    message: err?.message as string,
                });
                return z.NEVER;
            }
        },

        encode(value) {
            return JSON.stringify(value);
        },
    });
}
