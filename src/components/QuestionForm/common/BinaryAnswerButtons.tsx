// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { getQuestionState } from "../../../helper/ui";
import * as Question from "../../../model/Question";

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
    const [idPrefix, getQuestion, setQuestion] = getQuestionState(index);

    return (
        <ButtonGroup>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}neg`}>{labels[negative]}</Tooltip>}>
                <Button
                    variant={answer === negative ? "success" : "outline-success"}
                    onClick={() => {
                        const q = getQuestion();
                        if (q) {
                            setQuestion(Question.withAnswer(q, negative));
                        }
                    }}
                >
                    <i className={icons[negative]} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}pos`}>{labels[positive]}</Tooltip>}>
                <Button
                    variant={answer === positive ? "danger" : "outline-danger"}
                    onClick={() => {
                        const q = getQuestion();
                        if (q) {
                            setQuestion(Question.withAnswer(q, positive));
                        }
                    }}
                >
                    <i className={icons[positive]} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}null`}>No answer</Tooltip>}>
                <Button
                    variant={answer === undefined ? "secondary" : "outline-secondary"}
                    onClick={() => {
                        const q = getQuestion();
                        if (q) {
                            setQuestion(Question.withAnswer(q, undefined));
                        }
                    }}
                >
                    <i className="bi bi-ban" />
                </Button>
            </OverlayTrigger>
        </ButtonGroup>
    );
}
