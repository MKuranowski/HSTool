// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { ReactNode } from "react";
import { Accordion, Button, ListGroup } from "react-bootstrap";
import type { ButtonVariant } from "react-bootstrap/esm/types";
import * as Question from "../model/Question";
import { $questions, $stagingQuestion } from "../state";

const ROOT = [21, 52.2];

function NewQuestionButton({
    kind,
    children,
    variant,
    size = "sm",
}: {
    kind: Question.Kind;
    children?: ReactNode | undefined;
    variant: ButtonVariant;
    size?: "sm" | "lg";
}) {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => {
                $stagingQuestion.set(Question.empty(kind, ROOT));
            }}
        >
            {children}
        </Button>
    );
}

function QuestionEditor({ q }: { q: Question.T }) {
    return (
        <ListGroup>
            <ListGroup.Item active>{Question.name(q)}</ListGroup.Item>
            <ListGroup.Item>
                <p>Lorem ipsum dolor sit amet consectetur.</p>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                        $stagingQuestion.set(null);
                    }}
                >
                    Delete
                </Button>
            </ListGroup.Item>
        </ListGroup>
    );
}

function QuestionPicker() {
    return (
        <>
            <div className="d-flex justify-content-center">
                <h5>Create new question:</h5>
            </div>
            <div
                aria-label="Add question"
                className="d-flex flex-wrap justify-content-center gap-1"
            >
                <NewQuestionButton kind="match-area" variant="primary">
                    Match Area
                </NewQuestionButton>
                <NewQuestionButton kind="match-point" variant="info">
                    Match Point
                </NewQuestionButton>
                <NewQuestionButton kind="measure" variant="success">
                    Measure
                </NewQuestionButton>
                <NewQuestionButton kind="radar" variant="warning">
                    Radar
                </NewQuestionButton>
                <NewQuestionButton kind="thermometer" variant="danger">
                    Thermometer
                </NewQuestionButton>
                <NewQuestionButton kind="tentacles" variant="dark">
                    Tentacles
                </NewQuestionButton>
                <NewQuestionButton kind="custom" variant="secondary">
                    Custom
                </NewQuestionButton>
            </div>
        </>
    );
}

export default function Questions() {
    const questions = useStore($questions);
    const stagingQuestion = useStore($stagingQuestion);

    return (
        <>
            {stagingQuestion === null ? <QuestionPicker /> : <QuestionEditor q={stagingQuestion} />}
            <hr />
            <Accordion>
                {questions.map((q, idx) => {
                    const key = `question-${idx.toFixed(0)}`;
                    return (
                        <Accordion.Item key={key} eventKey={key}>
                            <Accordion.Header>{Question.name(q)}</Accordion.Header>
                            <Accordion.Body>Lorem ipsum dolor sit amet consectetur</Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </>
    );
}
