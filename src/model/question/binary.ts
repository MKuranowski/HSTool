// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Position } from "geojson";
import { Question } from "./base";

export abstract class BinaryDistanceQuestion<
    NegativeAnswer extends string,
    PositiveAnswer extends string,
> extends Question<NegativeAnswer | PositiveAnswer> {
    #negativeAnswer: NegativeAnswer;
    #positiveAnswer: PositiveAnswer;

    constructor(negativeAnswer: NegativeAnswer, positiveAnswer: PositiveAnswer) {
        super();
        this.#negativeAnswer = negativeAnswer;
        this.#positiveAnswer = positiveAnswer;
    }

    abstract calculateDistanceDelta(pos: Position): number;

    categorizePoint(pos: Position, tolerance: number): NegativeAnswer | PositiveAnswer | null {
        const delta = this.calculateDistanceDelta(pos);

        if (Math.abs(delta) <= tolerance) return null;
        return delta < 0 ? this.#negativeAnswer : this.#positiveAnswer;
    }
}
