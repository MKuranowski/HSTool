// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import {
    Accordion,
    Button,
    ButtonGroup,
    ListGroup,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import * as Question from "../model/Question";
import { $defaultMakerLocation, $questions, $stagingQuestion } from "../state";
import { QuestionColor, QuestionForm, QuestionIcon, QuestionKindName } from "./QuestionForm";

function NewQuestionButton({ kind }: { kind: Question.Kind }) {
    return (
        <OverlayTrigger overlay={<Tooltip id={`new-q-${kind}`}>{QuestionKindName(kind)}</Tooltip>}>
            <Button
                variant={QuestionColor(kind)}
                onClick={() => {
                    const root = $defaultMakerLocation.get();
                    $stagingQuestion.set(Question.empty(kind, root));
                }}
            >
                <QuestionIcon kind={kind} hidden />
            </Button>
        </OverlayTrigger>
    );
}

function QuestionStagingArea({ q }: { q: Question.T }) {
    return (
        <ListGroup>
            <ListGroup.Item variant={QuestionColor(q.kind)}>{Question.name(q)}</ListGroup.Item>
            <ListGroup.Item>
                <QuestionForm q={q} index={null} />
            </ListGroup.Item>
        </ListGroup>
    );
}

function QuestionPicker() {
    return (
        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
            <ButtonGroup>
                <Button variant="outline-dark" disabled>
                    <i className="d-block d-sm-none d-lg-block d-xl-none bi bi-plus-lg" />
                    <span className="d-none d-sm-block d-lg-none d-xl-block">Add new</span>
                </Button>
                <NewQuestionButton kind="match-area" />
                <NewQuestionButton kind="match-point" />
                <NewQuestionButton kind="measure" />
                <NewQuestionButton kind="radar" />
                <NewQuestionButton kind="thermometer" />
                <NewQuestionButton kind="tentacles" />
                <NewQuestionButton kind="custom" />
            </ButtonGroup>
        </div>
    );
}

export default function Questions() {
    const questions = useStore($questions);
    const stagingQuestion = useStore($stagingQuestion);

    return (
        <>
            {stagingQuestion === null ? (
                <QuestionPicker />
            ) : (
                <QuestionStagingArea q={stagingQuestion} />
            )}
            <hr />
            <Accordion>
                {questions.map((q, idx) => {
                    const key = `question-${idx.toFixed(0)}`;
                    return (
                        <Accordion.Item key={key} eventKey={key}>
                            <Accordion.Header className="overflow-x-scroll">
                                {Question.name(q)}
                            </Accordion.Header>
                            <Accordion.Body>
                                <QuestionForm q={q} index={idx} />
                            </Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </>
    );
}
