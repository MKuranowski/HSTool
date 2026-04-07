// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useValue } from "@legendapp/state/react";
import type { Position } from "geojson";
import type { ReactNode } from "react";
import { Accordion, Button, ListGroup } from "react-bootstrap";
import type { ButtonVariant } from "react-bootstrap/esm/types";
import {
    CustomQuestion,
    MatchAreaQuestion,
    MatchPointQuestion,
    MeasureQuestion,
    RadarQuestion,
    type SerializableQuestion,
    TentaclesQuestion,
    ThermometerQuestion,
} from "../model/question";
import { $questions, $stagingQuestion } from "../model/state";

const ROOT = [21, 52.2];

function NewQuestionButton({
    constructor,
    children,
    variant,
    size = "sm",
}: {
    constructor: (seeker: Position) => SerializableQuestion;
    children?: ReactNode | undefined;
    variant: ButtonVariant;
    size?: "sm" | "lg";
}) {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => {
                $stagingQuestion.set(constructor(ROOT));
            }}
        >
            {children}
        </Button>
    );
}

function QuestionEditor({ q }: { q: SerializableQuestion }) {
    return (
        <ListGroup>
            <ListGroup.Item active>{q.name}</ListGroup.Item>
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
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={MatchAreaQuestion.empty} variant="primary">
                    Match Area
                </NewQuestionButton>
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={MatchPointQuestion.empty} variant="info">
                    Match Point
                </NewQuestionButton>
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={MeasureQuestion.empty} variant="success">
                    Measure
                </NewQuestionButton>
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={RadarQuestion.empty} variant="warning">
                    Radar
                </NewQuestionButton>
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={ThermometerQuestion.empty} variant="danger">
                    Thermometer
                </NewQuestionButton>
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={TentaclesQuestion.empty} variant="dark">
                    Tentacles
                </NewQuestionButton>
                {/* eslint-disable-next-line @typescript-eslint/unbound-method */}
                <NewQuestionButton constructor={CustomQuestion.empty} variant="secondary">
                    Custom
                </NewQuestionButton>
            </div>
        </>
    );
}

export default function Questions() {
    const questions = useValue($questions);
    const stagingQuestion = useValue($stagingQuestion);

    return (
        <>
            {stagingQuestion === null ? (
                <QuestionPicker />
            ) : (
                <QuestionEditor q={stagingQuestion as SerializableQuestion} />
            )}
            <hr />
            <Accordion>
                {questions.map((q, idx) => {
                    const key = `question-${idx.toFixed(0)}`;
                    return (
                        <Accordion.Item key={key} eventKey={key}>
                            <Accordion.Header>{q.name}</Accordion.Header>
                            <Accordion.Body>Lorem ipsum dolor sit amet consectetur</Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </>
    );
}
