// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { $questions, $stagingQuestion } from "../../../state";

const labels = {
    hit: "Hit",
    miss: "Miss",
    closer: "Closer",
    further: "Further",
    hotter: "Hotter",
    colder: "Colder",
} as const;

const icons = {
    hit: "bi bi-check",
    miss: "bi bi-x",
    closer: "bi bi-box-arrow-in-down",
    further: "bi bi-box-arrow-up",
    hotter: "bi bi-thermometer-sun",
    colder: "bi bi-thermometer-snow",
} as const;

function setAnswer(index: number | null, answer: string | undefined): void {
    if (index === null) {
        const q = $stagingQuestion.get();
        if (q !== null) {
            // @ts-expect-error it's the callers responsibility to provide valid answers
            $stagingQuestion.set({ ...q, answer });
        }
    } else {
        const q = $questions.get().at(index);
        if (q !== undefined) {
            // @ts-expect-error it's the callers responsibility to provide valid answers
            $questions.replace(index, { ...q, answer });
        }
    }
}

export default function BinaryAnswerButtons({
    negative,
    positive,
    answer,
    index,
}: {
    negative: "hit" | "closer" | "colder";
    positive: "miss" | "further" | "hotter";
    answer?: string | undefined;
    index: number | null;
}) {
    const idPrefix = index === null ? "q-form-staging" : `q-form-${index.toFixed(0)}`;

    return (
        <ButtonGroup className="me-1">
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}null`}>No answer</Tooltip>}>
                <Button
                    variant={answer === undefined ? "warning" : "outline-warning"}
                    onClick={() => {
                        setAnswer(index, undefined);
                    }}
                >
                    <i className="bi bi-ban" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}neg`}>{labels[negative]}</Tooltip>}>
                <Button
                    variant={answer === negative ? "success" : "outline-success"}
                    onClick={() => {
                        setAnswer(index, negative);
                    }}
                >
                    <i className={icons[negative]} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}pos`}>{labels[positive]}</Tooltip>}>
                <Button
                    variant={answer === positive ? "danger" : "outline-danger"}
                    onClick={() => {
                        setAnswer(index, positive);
                    }}
                >
                    <i className={icons[positive]} />
                </Button>
            </OverlayTrigger>
        </ButtonGroup>
    );
}
