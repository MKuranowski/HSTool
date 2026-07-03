// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import type { JSX } from "react";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { questionToMessage } from "../../../helper/questionShare.ts";
import { toString } from "../../../helper/strings.ts";
import { type Question } from "../../../model/question/index.ts";
import Timestamp from "../../../model/timestamp.ts";
import $ from "../../../state.ts";
import TimeSelector from "./TimeSelector.tsx";

export function EditCommitButton({ q, index }: { q: Question; index: number | null }) {
    useSignals();

    if (index === null) {
        return (
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-commit`}>Commit</Tooltip>}>
                <Button
                    variant="primary"
                    onClick={() => {
                        // When committing a question, mark all of its timestamps as
                        // explicit to prevent any modifications.
                        const askedAt = q.askedAt.peek();
                        if (askedAt) askedAt.explicit.value = true;

                        const answeredAt = q.answeredAt.peek();
                        if (answeredAt) answeredAt.explicit.value = true;

                        // Push the question to the question list
                        batch(() => {
                            $.questions.push(q);
                            $.stagingQuestion.value = null;
                        });
                    }}
                >
                    <i className="bi bi-arrow-bar-down" />
                </Button>
            </OverlayTrigger>
        );
    } else {
        return (
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-edit`}>Edit</Tooltip>}>
                <Button
                    variant="primary"
                    onClick={() => {
                        if ($.stagingQuestion.peek() === null) {
                            $.questions.splice(index, 1);
                            $.stagingQuestion.value = q;
                        }
                    }}
                    disabled={$.stagingQuestion.value !== null}
                >
                    <i className="bi bi-arrow-bar-up" />
                </Button>
            </OverlayTrigger>
        );
    }
}

export function ShareButton({ q }: { q: Question }) {
    return (
        <OverlayTrigger
            overlay={
                <Tooltip id={`q-${q.id}-share`}>Copy sharable question text to clipboard</Tooltip>
            }
        >
            <Button
                variant="secondary"
                onClick={() => {
                    // Update askedAt
                    const askedAt = q.askedAt.value;
                    if (askedAt === undefined) {
                        q.askedAt.value = new Timestamp();
                    } else {
                        askedAt.update();
                    }

                    // Copy to clipboard
                    navigator.clipboard
                        .writeText(questionToMessage(q))
                        .catch((error: unknown) => {
                            console.error("Failed to paste question text:", error);
                            $.toast.value = {
                                header: "Failed to paste question text",
                                body: toString(error),
                                variant: "danger",
                            };
                        });
                }}
            >
                <i className="bi bi-share" />
            </Button>
        </OverlayTrigger>
    );
}

export default function CommonButtons({
    q,
    index,
    children,
}: {
    q: Question;
    index: number | null;
    children?: JSX.Element | undefined;
}) {
    useSignals();

    return (
        <>
            <TimeSelector q={q} variant="askedAt" className="mb-2" />
            <TimeSelector q={q} variant="answeredAt" className="mb-2" />
            <div className="d-inline-flex">
                {children}
                <ButtonGroup className="ms-1">
                    <EditCommitButton q={q} index={index} />
                    <OverlayTrigger
                        overlay={
                            <Tooltip id={`q-${q.id}-inEnd`}>
                                When flag is filled - use this question in the end game
                            </Tooltip>
                        }
                    >
                        <Button
                            variant="secondary"
                            onClick={() => {
                                q.toggleInEndGame();
                            }}
                        >
                            <i className={q.inEndGame.value ? "bi bi-flag-fill" : "bi bi-flag"} />
                        </Button>
                    </OverlayTrigger>
                    <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-del`}>Delete</Tooltip>}>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (index === null) {
                                    $.stagingQuestion.value = null;
                                } else {
                                    $.questions.splice(index, 1);
                                }
                            }}
                        >
                            <i className="bi bi-trash" />
                        </Button>
                    </OverlayTrigger>
                    <ShareButton q={q} />
                </ButtonGroup>
            </div>
        </>
    );
}
