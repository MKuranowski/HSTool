// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Variant } from "react-bootstrap/esm/types";
import * as Question from "../../model/Question";

export function QuestionColor(kind: Question.Kind): Variant {
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
    kind: Question.Kind;
    hidden?: boolean | undefined;
}) {
    return <i className={QuestionIconClass(kind)} aria-hidden={hidden} />;
}

export function QuestionIconClass(kind: Question.Kind): string {
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

export function QuestionKindName(kind: Question.Kind): string {
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
