// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as Question from "../model/Question";
import { $questions, $stagingQuestion } from "../state";

/**
 * Returns a unique prefix from the provided question index (null for "staging");
 * to be used in React keys.
 */
export function getQuestionPrefix(index: number | null): string {
    return index === null ? "q-form-staging-" : `q-form-${index.toFixed(0)}-`;
}

/**
 * Returns a unique prefix, a getter and setter for a question at the provided index
 * (null for "staging").
 */
export function getQuestionState(
    index: number | null,
): [string, () => Question.T | null, (q: Question.T) => void] {
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
            () => $questions.get()[index] ?? null,
            (q: Question.T) => {
                $questions.replace(index, q);
            },
        ];
    }
}
