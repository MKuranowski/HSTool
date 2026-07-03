// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
import { useState } from "react";
import {
    Button,
    ButtonGroup,
    Dropdown,
    Form,
    InputGroup,
    ListGroup,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import { loadPresetFromUrl } from "../helper/builtinPresets.ts";
import { toString } from "../helper/strings.ts";
import $, { jsonCodec } from "../state.ts";
import { presetSchema } from "../wire/preset.ts";

const presetSchemaJson = jsonCodec(presetSchema);

function BuiltinPresetSelect() {
    useSignals();
    const [selectedPreset, setSelectedPreset] = useState("");

    const builtinPresetNames = [...$.builtinPresets.value.keys()];
    const collator = new Intl.Collator();
    builtinPresetNames.sort((a, b) => collator.compare(a, b));

    if (builtinPresetNames.length === 0) return null;

    return (
        <Dropdown as={ButtonGroup} className="me-2">
            <Button
                variant="secondary"
                disabled={selectedPreset === ""}
                onClick={() => {
                    const url = $.builtinPresets.peek().get(selectedPreset);
                    if (url === undefined) {
                        console.error(`Unknown builtin preset: ${JSON.stringify(selectedPreset)}`);
                        return;
                    }

                    void loadPresetFromUrl(selectedPreset, url);
                }}
            >
                {selectedPreset ? `Load ${selectedPreset}` : "Select builtin"}
            </Button>
            <Dropdown.Toggle split variant="secondary" />
            <Dropdown.Menu>
                {builtinPresetNames.map((name) => (
                    <Dropdown.Item
                        key={name}
                        onClick={() => {
                            setSelectedPreset(name);
                        }}
                    >
                        {name}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export function PresetInput() {
    useSignals();
    return (
        <>
            <span className="flex-fill">Current preset: {$.preset.name}</span>
            <BuiltinPresetSelect />
            <Button
                variant="primary"
                onClick={() => {
                    navigator.clipboard
                        .readText()
                        .then((content) => {
                            $.preset.update(presetSchemaJson.decode(content));
                            $.clearGame();
                            $.toast.value = { header: "Preset loaded", variant: "success" };
                        })
                        .catch((error: unknown) => {
                            console.error("Failed to read preset from clipboard:", error);
                            $.toast.value = {
                                header: "Failed to read preset",
                                body: toString(error),
                                variant: "danger",
                            };
                        });
                }}
            >
                Paste
            </Button>
        </>
    );
}

export function AnswerTimeInput({ photo = false }: { photo?: boolean | undefined }) {
    // useSignals(); // not needed, changes are handled by useSignalEffect
    const input = useSignalRef<HTMLInputElement | null>(null);
    const signal = photo ? $.preset.photoAnswerTime : $.preset.answerTime;

    useSignalEffect(() => {
        if (input.current && signal.value !== input.current.valueAsNumber) {
            input.current.valueAsNumber = signal.value;
        }
    });

    const helper = photo
        ? (
            <OverlayTrigger
                flip
                overlay={
                    <Tooltip id="photo-answer-time">
                        Any custom question with the word &quot;photo&quot;
                    </Tooltip>
                }
            >
                <i className="bi bi-question-circle" />
            </OverlayTrigger>
        )
        : null;
    return (
        <InputGroup className="mb-2">
            <InputGroup.Text className="column-gap-1">
                {photo ? "Photo question answer time" : "Other question answer time"} {helper}
            </InputGroup.Text>
            <Form.Control
                ref={input}
                className="was-validated"
                type="number"
                min="0"
                step="1"
                defaultValue={signal.peek()}
                required
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num) && num >= 0) signal.value = num;
                }}
            />
            <InputGroup.Text>min</InputGroup.Text>
        </InputGroup>
    );
}

export function QuickAnswerMultiplierInput() {
    // useSignals(); // not needed, changes are handled by useSignalEffect
    const input = useSignalRef<HTMLInputElement | null>(null);

    useSignalEffect(() => {
        if (input.current && input.current.valueAsNumber !== $.preset.quickAnswerMultiplier.value) {
            input.current.valueAsNumber = $.preset.quickAnswerMultiplier.value;
        }
    });

    return (
        <InputGroup className="mb-2">
            <InputGroup.Text className="column-gap-1">
                Quick answer multiplier
                <OverlayTrigger
                    flip
                    overlay={
                        <Tooltip id="quick-answer-multiplier">
                            Bonus time added to the hiding time for quick answering questions,
                            calculated by truncating the answer time multiplied by this factor. For
                            example, when set to 0.5, if the hider answers a photo question with 5
                            minutes leftover, (⌊5*0.5⌋=⌊2.5⌋=) 2 minutes will be added to their
                            hiding time. Set to 0 to disable.
                        </Tooltip>
                    }
                >
                    <i className="bi bi-question-circle" />
                </OverlayTrigger>
            </InputGroup.Text>
            <Form.Control
                ref={input}
                className="was-validated"
                type="number"
                min="0"
                step="0.1"
                defaultValue={$.preset.quickAnswerMultiplier.peek()}
                required
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num) && num >= 0) $.preset.quickAnswerMultiplier.value = num;
                }}
            />
        </InputGroup>
    );
}

export function HidingZoneRadiusInput() {
    // useSignals(); // not needed, changes are handled by useSignalEffect
    const input = useSignalRef<HTMLInputElement | null>(null);

    useSignalEffect(() => {
        if (input.current && input.current.valueAsNumber !== $.preset.hidingRadius.value) {
            input.current.valueAsNumber = $.preset.hidingRadius.value;
        }
    });

    return (
        <InputGroup className="mb-2">
            <InputGroup.Text>Hiding zone radius</InputGroup.Text>
            <Form.Control
                ref={input}
                className="was-validated"
                type="number"
                min="0"
                step="0.1"
                defaultValue={$.preset.hidingRadius.peek()}
                required
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $.preset.hidingRadius.value = num;
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}

export function ShowHidingZonesInput() {
    useSignals();
    const showHidingZones = $.preferences.showHidingZones.value;
    return (
        <InputGroup className="mb-2">
            <InputGroup.Text>Show hiding zones</InputGroup.Text>
            <span className="flex-fill"></span>
            <Button
                variant={showHidingZones ? "success" : "outline-success"}
                onClick={() => {
                    $.preferences.showHidingZones.value = true;
                }}
            >
                <i className="bi bi-check" />
            </Button>
            <Button
                variant={showHidingZones ? "outline-danger" : "danger"}
                onClick={() => {
                    $.preferences.showHidingZones.value = false;
                }}
            >
                <i className="bi bi-x" />
            </Button>
        </InputGroup>
    );
}

export default function Settings() {
    return (
        <ListGroup>
            <ListGroup.Item>
                <AnswerTimeInput photo />
                <AnswerTimeInput />
                <QuickAnswerMultiplierInput />
                <HidingZoneRadiusInput />
                <ShowHidingZonesInput />
            </ListGroup.Item>
            <ListGroup.Item className="d-flex align-items-center">
                <PresetInput />
            </ListGroup.Item>
        </ListGroup>
    );
}
