// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Signal } from "@preact/signals-react";
import type { Position } from "../geo.ts";
import CustomQuestion from "./custom.ts";
import MatchAreaQuestion from "./match_area.ts";
import MatchPointQuestion from "./match_point.ts";
import MeasureQuestion from "./measure.ts";
import RadarQuestion from "./radar.ts";
import TentaclesQuestion from "./tentacles.ts";
import ThermometerQuestion from "./thermometer.ts";

export {
    CustomQuestion,
    MatchAreaQuestion,
    MatchPointQuestion,
    MeasureQuestion,
    RadarQuestion,
    TentaclesQuestion,
    ThermometerQuestion,
};

export type Question =
    | CustomQuestion
    | MatchAreaQuestion
    | MatchPointQuestion
    | MeasureQuestion
    | RadarQuestion
    | TentaclesQuestion
    | ThermometerQuestion;

export type QuestionKind = Question["kind"];

export function createNewQuestion(kind: QuestionKind): Question {
    switch (kind) {
        case "custom":
            return new CustomQuestion();

        case "match-area":
            return new MatchAreaQuestion();

        case "match-point":
            return new MatchPointQuestion();

        case "measure":
            return new MeasureQuestion();

        case "radar":
            return new RadarQuestion();

        case "tentacles":
            return new TentaclesQuestion();

        case "thermometer":
            return new ThermometerQuestion();
    }
}

export type QuestionWithSeekers = Extract<Question, { readonly seekers: Signal<Position> }>;

export function questionHasSeekers(q: Question): q is QuestionWithSeekers {
    return "seekers" in q;
}

export type QuestionWithDistance = Extract<Question, { readonly distance: Signal<number> }>;

export function questionHasDistance(q: Question): q is QuestionWithDistance {
    return "distance" in q;
}

export type QuestionWithCandidates = Extract<Question, { readonly candidatesName: Signal<string> }>;

export function questionHasCandidates(q: Question): q is QuestionWithCandidates {
    return "candidates" in q && "candidatesName" in q;
}

export type BinaryQuestion =
    | MatchAreaQuestion
    | MatchPointQuestion
    | MeasureQuestion
    | RadarQuestion
    | ThermometerQuestion;

export function questionIsBinary(q: Question): q is BinaryQuestion {
    switch (q.kind) {
        case "match-area":
        case "match-point":
        case "measure":
        case "radar":
        case "thermometer":
            return true;

        default:
            return false;
    }
}
