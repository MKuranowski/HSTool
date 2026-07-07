// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import * as turf from "@turf/turf";
import {
    Accordion,
    Button,
    ButtonGroup,
    ListGroup,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import { questionFromMessage } from "../helper/questionShare.ts";
import { toString } from "../helper/strings.ts";
import type { Position } from "../model/geo.ts";
import {
    createNewQuestion,
    type Question,
    questionHasSeekers,
    type QuestionKind,
} from "../model/question/index.ts";
import $ from "../state.ts";
import {
    QuestionColor,
    QuestionForm,
    QuestionIcon,
    QuestionKindName,
} from "./QuestionForm/index.tsx";

function computeInitialPinLocation(): Position {
    // If in the end game - start the pin there
    const endGameStation = $.endGameStation.peek();
    if (endGameStation !== null) return endGameStation.geometry.coordinates as Position;

    // Otherwise - set it to the center of mass of all leftover stations
    const disabledStations = $.disabledStations.peek();
    const activeStations = turf.featureCollection(
        $.preset.stations.peek().features.filter((s) => !disabledStations.has(s.properties.id)),
    );
    if (activeStations.features.length === 0) return [0, 0];
    return turf.centerOfMass(activeStations).geometry.coordinates as Position;
}

function NewQuestionButton({ kind }: { kind: QuestionKind }) {
    return (
        <OverlayTrigger overlay={<Tooltip id={`new-q-${kind}`}>{QuestionKindName(kind)}</Tooltip>}>
            <Button
                variant={QuestionColor(kind)}
                onClick={() => {
                    const q = createNewQuestion(kind);
                    q.inEndGame.value = $.endGameStation.peek() !== null && !$.hiderMode.peek();
                    if (questionHasSeekers(q)) {
                        q.seekers.value = computeInitialPinLocation();
                    }
                    $.stagingQuestion.value = q;
                }}
            >
                <QuestionIcon kind={kind} hidden />
            </Button>
        </OverlayTrigger>
    );
}

function PasteQuestionButton() {
    return (
        <OverlayTrigger overlay={<Tooltip id="new-q-paste">Paste from clipboard</Tooltip>}>
            <Button
                variant="outline-dark"
                onClick={() => {
                    navigator.clipboard
                        .readText()
                        .then((msg) => {
                            const q = questionFromMessage(msg);
                            $.stagingQuestion.value = q;

                            // Hider mode: print available answers, and update it if there's only one
                            const hiderStation = $.hiderStation.peek();
                            if (hiderStation) {
                                const hidingRadius = $.preset.hidingRadius.peek();
                                const answers = q.categorize(hiderStation, hidingRadius);

                                if (answers.length === 1) {
                                    const answer = answers[0];
                                    const name = answer.name ?? answer.id;
                                    q.setAnswer(answer.id);
                                    $.toast.value = {
                                        header: "Automatic answer",
                                        body:
                                            `The only possible answer at your station is:\n${name}`,
                                        variant: "primary",
                                    };
                                } else if (answers.length > 1) {
                                    const names = answers.map((a) => `\n- ${a.name ?? a.id}`)
                                        .join("");

                                    $.toast.value = {
                                        header: "Automatic answer",
                                        body:
                                            `There are multiple possible answers at your station:${names}`,
                                        variant: "primary",
                                    };
                                } else if (answers.length === 0 && q.answers.value.length > 0) {
                                    // Question should have answers, but categorize returned non
                                    $.toast.value = {
                                        header: "Automatic answer",
                                        body:
                                            "Couldn't determine available answers at your station.",
                                        variant: "warning",
                                    };
                                }
                            }
                        })
                        .catch((error: unknown) => {
                            console.error("Failed to read question from clipboard:", error);
                            $.toast.value = {
                                header: "Failed to read question from clipboard",
                                body: toString(error),
                                variant: "danger",
                            };
                        });
                }}
            >
                <i className="bi bi-clipboard" />
            </Button>
        </OverlayTrigger>
    );
}

function IncorrectAnswerFlag({ id }: { id: string }) {
    return (
        <OverlayTrigger
            overlay={<Tooltip id={`q-${id}-wrong`}>Incorrect answer for your station</Tooltip>}
        >
            <i className="bi bi-exclamation-circle-fill me-2 error-flag" />
        </OverlayTrigger>
    );
}

function QuestionStagingArea({ q }: { q: Question }) {
    useSignals();

    const hiderStation = $.hiderStation.value;
    const flag = hiderStation && !q.isAnsweredCorrectly(hiderStation, $.preset.hidingRadius.value)
        ? <IncorrectAnswerFlag id={q.id} />
        : null;

    return (
        <ListGroup>
            <ListGroup.Item variant={QuestionColor(q.kind)}>{flag}{q.name}</ListGroup.Item>
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
                <PasteQuestionButton />
            </ButtonGroup>
        </div>
    );
}

export default function Questions() {
    useSignals();

    const stagingQuestion = $.stagingQuestion.value;
    const stagingArea = stagingQuestion === null
        ? <QuestionPicker />
        : <QuestionStagingArea q={stagingQuestion} />;

    const hiderStation = $.hiderStation.value;
    const hidingRadius = hiderStation ? $.preset.hidingRadius.value : NaN;

    return (
        <>
            {stagingArea}
            <hr />
            <Accordion>
                {$.questions.value.map((q, idx) => {
                    const key = `question-${q.id}`;
                    const flag = hiderStation && !q.isAnsweredCorrectly(hiderStation, hidingRadius)
                        ? <IncorrectAnswerFlag id={q.id} />
                        : null;

                    return (
                        <Accordion.Item key={key} eventKey={key}>
                            <Accordion.Header>
                                {flag}
                                {q.name}
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
