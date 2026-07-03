// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import type { ReactNode } from "react";
import { Button, Form, FormControl, InputGroup } from "react-bootstrap";
import { dateToFormValue } from "../model/timestamp.ts";
import $ from "../state.ts";
import FormStack from "./other/FormStack.tsx";

function formatDuration(minutes: number | null): string {
    if (minutes === null) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toFixed(0)}:${m.toFixed(0).padStart(2, "0")}`;
}

function FakeFormControl({ children }: { children?: ReactNode | undefined }) {
    return (
        <FormControl as="div" className="d-flex align-items-center">
            {children}
        </FormControl>
    );
}

function TimeSelectorInput({ end = false }: { end?: boolean | undefined }) {
    useSignals();
    const signal = end ? $.timing.endTime : $.timing.startTime;
    const time = signal.value;

    let invalid = false;
    if (end && time) {
        const startTime = $.timing.startTime.value;
        // XXX: ISO timestamps can be compared as strings for ordering
        invalid = startTime === null || time < startTime;
    }

    return (
        <>
            <Form.Control
                type="datetime-local"
                value={time ? dateToFormValue(time) : ""}
                isInvalid={invalid}
                onChange={(e) => {
                    if (e.target.value) {
                        signal.value = new Date(e.target.value);
                    } else {
                        signal.value = null;
                    }
                }}
            />
            <Button
                size="sm"
                onClick={() => {
                    signal.value = new Date();
                }}
            >
                <i className="bi bi-clock" />
            </Button>
        </>
    );
}

function TimeBonusInput() {
    useSignals();
    return (
        <>
            <Form.Control
                type="number"
                min="0"
                step="1"
                defaultValue={$.timing.timeBonus.value}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $.timing.timeBonus.value = num;
                }}
            />
            <InputGroup.Text>min</InputGroup.Text>
        </>
    );
}

function ComputationStack() {
    useSignals();
    return (
        <FormStack>
            <FormStack.Row label="Base Time">
                <FakeFormControl>{formatDuration($.timing.baseTime.value)}</FakeFormControl>
            </FormStack.Row>
            <FormStack.Row label="Quick Answers">
                <FakeFormControl>
                    {formatDuration($.timing.answerBonuses.value.quick)}
                </FakeFormControl>
            </FormStack.Row>
            <FormStack.Row label="Slow Answers">
                <FakeFormControl>
                    {formatDuration(-$.timing.answerBonuses.value.slow)}
                </FakeFormControl>
            </FormStack.Row>
            <FormStack.Row label="Total">
                <FakeFormControl>
                    <strong>{formatDuration($.timing.totalHidingTime.value)}</strong>
                </FakeFormControl>
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
