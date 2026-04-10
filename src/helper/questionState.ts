// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as Question from "../model/Question";
import { $questions, $stagingQuestion } from "../state";

export function getQuestionPrefix(index: number | null): string {
    return index === null ? "q-form-staging-" : `q-form-${index.toFixed(0)}-`;
}

export function getQuestionState(
    index: number | null,
): [string, () => Question.T | null | undefined, (q: Question.T) => void] {
    const prefix = getQuestionPrefix(index);
    if (index === null) {
        return [
            prefix,
            $stagingQuestion.get.bind($stagingQuestion),
            $stagingQuestion.set.bind($stagingQuestion),
        ];
    } else {
        return [
            prefix,
            () => $questions.get()[index],
            (q: Question.T) => {
                $questions.replace(index, q);
            },
        ];
    }
}
