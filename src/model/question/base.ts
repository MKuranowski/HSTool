// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Position } from "geojson";

export type QuestionKind =
    | "match-area"
    | "match-point"
    | "measure"
    | "radar"
    | "thermometer"
    | "tentacles"
    | "custom";

export abstract class Question<Answer extends string | null = string | null> {
    answer: Answer | null = null;

    abstract get kind(): QuestionKind;
    abstract get name(): string;
    abstract categorizePoint(pos: Position, tolerance: number): Answer | null;
}
