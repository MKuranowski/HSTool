// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import type { BinaryQuestion } from "../../../model/question/index.ts";

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

export default function BinaryAnswerButtons({ q }: { q: BinaryQuestion }) {
    useSignals();
    const [negative, positive] = q.answers.value;

    return (
        <ButtonGroup>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-neg`}>{labels[negative]}</Tooltip>}>
                <Button
                    variant={q.answer.value === negative ? "success" : "outline-success"}
                    onClick={() => {
                        q.setAnswer(negative);
                    }}
                >
                    <i className={icons[negative]} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-pos`}>{labels[positive]}</Tooltip>}>
                <Button
                    variant={q.answer.value === positive ? "danger" : "outline-danger"}
                    onClick={() => {
                        q.setAnswer(positive);
                    }}
                >
                    <i className={icons[positive]} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-null`}>No answer</Tooltip>}>
                <Button
                    variant={q.answer.value === undefined ? "secondary" : "outline-secondary"}
                    onClick={() => {
                        q.setAnswer(undefined);
                    }}
                >
                    <i className="bi bi-ban" />
                </Button>
            </OverlayTrigger>
        </ButtonGroup>
    );
}
