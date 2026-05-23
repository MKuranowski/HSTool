// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { ReactNode } from "react";
import { Button, Form, FormControl, InputGroup } from "react-bootstrap";
import * as Timestamp from "../model/Timestamp";
import {
    $answerTime,
    $endTime,
    $photoAnswerTime,
    $questions,
    $quickAnswerMultiplier,
    $startTime,
    $timeBonus,
} from "../state";
import FormStack from "./other/FormStack";

function msToMin(ms: number): number {
    return Math.trunc(ms / 60_000);
}

function FakeFormControl({ children }: { children?: ReactNode | undefined }) {
    return (
        <FormControl as="div" className="d-flex align-items-center">
            {children}
        </FormControl>
    );
}

function TimeSelectorInput({ end = false }: { end?: boolean | undefined }) {
    const store = end ? $endTime : $startTime;
    const time = useStore(store);

    let invalid = false;
    if (end && time) {
        const startTime = $startTime.get();
        // XXX: ISO timestamps can be compared as strings for ordering
        invalid = startTime ? time < startTime : true;
    }

    return (
        <>
            <Form.Control
                type="datetime-local"
                value={time ? Timestamp.toFormValue({ t: time, explicit: false }) : undefined}
                isInvalid={invalid}
                onChange={(e) => {
                    store.set(Timestamp.fromFormValue(e.target.value).t);
                }}
            />
            <Button
                size="sm"
                onClick={() => {
                    store.set(new Date().toISOString());
                }}
            >
                <i className="bi bi-clock" />
            </Button>
        </>
    );
}

function TimeBonusInput() {
    const bonus = useStore($timeBonus);
    return (
        <>
            <Form.Control
                type="number"
                min="0"
                step="1"
                defaultValue={bonus}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $timeBonus.set(num);
                }}
            />
            <InputGroup.Text>min</InputGroup.Text>
        </>
    );
}

function ComputationStack() {
    const start = useStore($startTime);
    const end = useStore($endTime);
    const questions = useStore($questions);
    const expectedAnswerTime = useStore($answerTime);
    const expectedPhotoAnswerTime = useStore($photoAnswerTime);
    const quickAnswerMultiplier = useStore($quickAnswerMultiplier);
    const bonuses = useStore($timeBonus);

    if (!start || !end || end < start) return null;

    const base = msToMin(Date.parse(end) - Date.parse(start));
    let quickAnswers = 0;
    let slowAnswers = 0;

    for (const q of questions) {
        if (q.askedAt === undefined || q.answeredAt === undefined || q.answeredAt.t < q.askedAt.t)
            continue;

        const answerTime = msToMin(Date.parse(q.answeredAt.t) - Date.parse(q.askedAt.t));
        const isPhoto = q.kind === "custom" && /\bphotos?\b/im.test(q.name);
        const timeDelta = (isPhoto ? expectedPhotoAnswerTime : expectedAnswerTime) - answerTime;

        quickAnswers += Math.trunc(Math.max(0, timeDelta) * quickAnswerMultiplier);
        slowAnswers += Math.min(0, timeDelta);
    }

    const total = base + bonuses + quickAnswers + slowAnswers;

    return (
        <FormStack>
            <FormStack.Row label="Base Time">
                <FakeFormControl>{base}</FakeFormControl>
                <InputGroup.Text>min</InputGroup.Text>
            </FormStack.Row>
            <FormStack.Row label="Quick Answers">
                <FakeFormControl>{quickAnswers}</FakeFormControl>
                <InputGroup.Text>min</InputGroup.Text>
            </FormStack.Row>
            <FormStack.Row label="Slow Answers">
                <FakeFormControl>{slowAnswers}</FakeFormControl>
                <InputGroup.Text>min</InputGroup.Text>
            </FormStack.Row>
            <FormStack.Row label="Total">
                <FakeFormControl>
                    <strong>{total}</strong>
                </FakeFormControl>
                <InputGroup.Text>min</InputGroup.Text>
            </FormStack.Row>
        </FormStack>
    );
}

export default function Timing() {
    return (
        <>
            <FormStack className="mb-2">
                <FormStack.Row label="Start Time">
                    <TimeSelectorInput />
                </FormStack.Row>
                <FormStack.Row label="End Time">
                    <TimeSelectorInput end />
                </FormStack.Row>
                <FormStack.Row label="Time Bonuses">
                    <TimeBonusInput />
                </FormStack.Row>
            </FormStack>
            <ComputationStack />
        </>
    );
}
