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
                    q.inEndGame.value = $.endGameStation.peek() !== null;
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

function QuestionStagingArea({ q }: { q: Question }) {
    useSignals();
    return (
        <ListGroup>
            <ListGroup.Item variant={QuestionColor(q.kind)}>{q.name}</ListGroup.Item>
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
    useSignals();

    const stagingQuestion = $.stagingQuestion.value;
    const stagingArea = stagingQuestion === null
        ? <QuestionPicker />
        : <QuestionStagingArea q={stagingQuestion} />;

    return (
        <>
            {stagingArea}
            <hr />
            <Accordion>
                {$.questions.value.map((q, idx) => {
                    const key = `question-${q.id}`;
                    return (
                        <Accordion.Item key={key} eventKey={key}>
                            <Accordion.Header className="overflow-x-scroll">
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
