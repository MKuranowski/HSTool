// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Variant } from "react-bootstrap/esm/types";
import { type Question, type QuestionKind } from "../../model/question/index.ts";
import CustomQuestionForm from "./CustomQuestionForm.tsx";
import MatchAreaQuestionForm from "./MatchAreaQuestionForm.tsx";
import MatchPointQuestionForm from "./MatchPointQuestionForm.tsx";
import MeasureQuestionForm from "./MeasureQuestionForm.tsx";
import RadarQuestionForm from "./RadarQuestionForm.tsx";
import TentaclesQuestionForm from "./TentaclesQuestionForm.tsx";
import ThermometerQuestionForm from "./ThermometerQuestionForm.tsx";

export function QuestionForm({ q, index }: { q: Question; index: number | null }) {
    switch (q.kind) {
        case "match-area":
            return <MatchAreaQuestionForm q={q} index={index} />;

        case "match-point":
            return <MatchPointQuestionForm q={q} index={index} />;

        case "measure":
            return <MeasureQuestionForm q={q} index={index} />;

        case "radar":
            return <RadarQuestionForm q={q} index={index} />;

        case "thermometer":
            return <ThermometerQuestionForm q={q} index={index} />;

        case "tentacles":
            return <TentaclesQuestionForm q={q} index={index} />;

        case "custom":
            return <CustomQuestionForm q={q} index={index} />;
    }
}

export function QuestionColor(kind: QuestionKind): Variant {
    switch (kind) {
        case "custom":
            return "secondary";
        case "match-area":
            return "primary";
        case "match-point":
            return "info";
        case "measure":
            return "success";
        case "radar":
            return "warning";
        case "tentacles":
            return "dark";
        case "thermometer":
            return "danger";
    }
}

export function QuestionIcon({
    kind,
    hidden,
}: {
    kind: QuestionKind;
    hidden?: boolean | undefined;
}) {
    return <i className={QuestionIconClass(kind)} aria-hidden={hidden} />;
}

export function QuestionIconClass(kind: QuestionKind): string {
    switch (kind) {
        case "custom":
            return "bi bi-pencil";
        case "match-area":
            return "bi bi-heptagon";
        case "match-point":
            return "bi bi-geo";
        case "measure":
            return "bi bi-rulers";
        case "radar":
            return "bi bi-radar";
        case "tentacles":
            return "bi bi-layout-wtf";
        case "thermometer":
            return "bi bi-thermometer-half";
    }
}

export function QuestionKindName(kind: QuestionKind): string {
    switch (kind) {
        case "custom":
            return "Custom";
        case "match-area":
            return "Match Area";
        case "match-point":
            return "Match Point";
        case "measure":
            return "Measure";
        case "radar":
            return "Radar";
        case "tentacles":
            return "Tentacles";
        case "thermometer":
            return "Thermometer";
    }
}
