// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { JSX } from "react";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { getQuestionPrefix } from "../../../helper/ui";
import * as Question from "../../../model/Question";
import { $questions, $stagingQuestion } from "../../../state";
import TimeSelector from "./TimeSelector";

export function EditCommitButton({ index }: { index: number | null }) {
    const stagingQuestion = useStore($stagingQuestion);
    const idPrefix = getQuestionPrefix(index);

    if (index === null) {
        return (
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}commit`}>Commit</Tooltip>}>
                <Button
                    variant="primary"
                    onClick={() => {
                        const q = $stagingQuestion.get();
                        if (q !== null) {
                            // When committing a question, mark all of its timestamps as
                            // explicit to prevent any modifications. Fortunately, because
                            // we're moving the question from one store to another it can
                            // just be mutated.
                            if (q.askedAt) q.askedAt.explicit = true;
                            if (q.answeredAt) q.answeredAt.explicit = true;

                            $questions.push(q);
                            $stagingQuestion.set(null);
                        }
                    }}
                >
                    <i className="bi bi-arrow-bar-down" />
                </Button>
            </OverlayTrigger>
        );
    } else {
        return (
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}edit`}>Edit</Tooltip>}>
                <Button
                    variant="primary"
                    onClick={() => {
                        if ($stagingQuestion.get() === null) {
                            const q = $questions.remove(index);
                            $stagingQuestion.set(q ?? null);
                        }
                    }}
                    disabled={stagingQuestion !== null}
                >
                    <i className="bi bi-arrow-bar-up" />
                </Button>
            </OverlayTrigger>
        );
    }
}

export default function CommonButtons({
    q,
    index,
    children,
}: {
    q: Question.T;
    index: number | null;
    children?: JSX.Element | undefined;
}) {
    const idPrefix = getQuestionPrefix(index);

    return (
        <>
            <TimeSelector time={q.askedAt} index={index} variant="askedAt" className="mb-2" />
            <TimeSelector time={q.answeredAt} index={index} variant="answeredAt" className="mb-2" />
            <div className="d-inline-flex">
                {children}
                <ButtonGroup className="ms-1">
                    <EditCommitButton index={index} />
                    <OverlayTrigger overlay={<Tooltip id={`${idPrefix}del`}>Delete</Tooltip>}>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (index === null) {
                                    $stagingQuestion.set(null);
                                } else {
                                    $questions.remove(index);
                                }
                            }}
                        >
                            <i className="bi bi-trash" />
                        </Button>
                    </OverlayTrigger>
                </ButtonGroup>
            </div>
        </>
    );
}
