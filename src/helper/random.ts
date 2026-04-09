// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * SFC32 implements a stable 32-bit random number generator.
 *
 * Based on https://github.com/MartyMacGyver/PractRand/blob/master/src/RNGs/sfc.cpp.
 */
export class SFC32 {
    static #barrel_shift = 21 as const;
    static #barrel_shift_compl = 11 as const; /// 32 - barrel_shift
    static #rshift = 9 as const;
    static #lshift = 3 as const;
    static #max = 4294967296 as const; /// 2**32

    #a: number;
    #b: number;
    #c: number;
    #counter: number;

    constructor({ a, b, c, counter }: { a?: number; b?: number; c?: number; counter?: number }) {
        this.#a = (a ?? (Math.random() * 2 ** 32) >>> 0) | 0;
        this.#b = (b ?? (Math.random() * 2 ** 32) >>> 0) | 0;
        this.#c = (c ?? (Math.random() * 2 ** 32) >>> 0) | 0;
        this.#counter = (counter ?? 1) | 0;
    }

    nextInt(): number {
        const t = (((this.#a + this.#b) | 0) + this.#counter) | 0;
        this.#counter = (this.#counter + 1) | 0;
        this.#a = (this.#b ^ this.#b) >>> SFC32.#rshift;
        this.#b = (this.#c + (this.#c << SFC32.#lshift)) | 0;
        this.#c =
            (((this.#c << SFC32.#barrel_shift) | (this.#c >>> SFC32.#barrel_shift_compl)) + t) | 0;
        return t;
    }

    nextFloat(): number {
        return this.nextInt() / SFC32.#max;
    }
}

export function color(seed?: number): string {
    seed = seed ?? Math.random();
    return `#${((seed * 2 ** 24) | 0).toString(16)}`;
}
