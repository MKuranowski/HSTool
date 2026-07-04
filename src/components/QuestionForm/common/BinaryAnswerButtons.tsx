// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import type { BinaryQuestion } from "../../../model/question/index.ts";
import $ from "../../../state.ts";
import DeriveAnswerButton from "./DeriveAnswerButton.tsx";

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

type Answer = keyof typeof labels;

function BinaryAnswerButton({ q, variant, answer, disabled = false }: {
    q: BinaryQuestion;
    variant: "success" | "danger" | "secondary";
    answer?: Answer | undefined;
    disabled?: boolean | undefined;
}) {
    useSignals();

    const buttonVariant = q.answer.value === answer ? variant : `outline-${variant}` as const;
    const buttonIcon = answer ? icons[answer] : "bi bi-ban";
    const buttonLabel = answer ? labels[answer] : "No answer";

    if (disabled) {
        return (
            <Button variant={q.answer.value === answer ? variant : `outline-${variant}`} disabled>
                <i className={buttonIcon} />
            </Button>
        );
    }
    return (
        <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-${answer}`}>{buttonLabel}</Tooltip>}>
            <Button
                variant={buttonVariant}
                onClick={() => {
                    q.setAnswer(answer);
                }}
            >
                <i className={buttonIcon} />
            </Button>
        </OverlayTrigger>
    );
}

export default function BinaryAnswerButtons({ q }: { q: BinaryQuestion }) {
    useSignals();
    const [negative, positive] = q.answers.value;

    let soleAvailableAnswer: string | null = null;
    if ($.hiderStation.value) {
        const answers = q.categorize($.hiderStation.value, $.preset.hidingRadius.value);
        if (answers.length === 1) soleAvailableAnswer = answers[0].id;
    }

    return (
        <ButtonGroup>
            <BinaryAnswerButton
                q={q}
                answer={negative}
                variant="success"
                disabled={soleAvailableAnswer !== null && soleAvailableAnswer !== negative}
            />
            <BinaryAnswerButton
                q={q}
                answer={positive}
                variant="danger"
                disabled={soleAvailableAnswer !== null && soleAvailableAnswer !== positive}
            />
            {$.hiderStation.value
                ? <DeriveAnswerButton q={q} disabled={soleAvailableAnswer !== null} />
                : (
                    <BinaryAnswerButton
                        q={q}
                        answer={undefined}
                        variant="secondary"
                        disabled={$.hiderStation.value !== null}
                    />
                )}
        </ButtonGroup>
    );
}
