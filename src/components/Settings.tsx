// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
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
import builtinPresetsIndexUrl from "/presets/index.json?url";
import { zodJson } from "../helper/store";
import { toString } from "../helper/strings";
import * as Preset from "../model/Preset";
import {
    $answerTime,
    $builtinPresets,
    $circlePrecision,
    $hidingZoneRadius,
    $photoAnswerTime,
    $preset,
    $quickAnswerMultiplier,
    $showHidingZones,
    $toast,
    clearGameState,
} from "../state";

const presetSchemaJson = zodJson(Preset.schema);
const builtinPresetBaseUrl = builtinPresetsIndexUrl.substring(
    0,
    builtinPresetsIndexUrl.lastIndexOf("/") + 1,
);

function onPresetPaste(): void {
    navigator.clipboard
        .readText()
        .then((content) => {
            $preset.set(presetSchemaJson.decode(content));
            clearGameState();
            $toast.set({ header: "Preset loaded", variant: "success" });
        })
        .catch((error: unknown) => {
            console.error("Failed to read preset from clipboard:", error);
            $toast.set({
                header: "Failed to read preset",
                body: toString(error),
                variant: "danger",
            });
        });
}

function BuiltinPresetSelect() {
    const builtinPresets = useStore($builtinPresets);
    const [selectedPreset, setSelectedPreset] = useState("");
    if (Object.keys(builtinPresets).length === 0) return null;

    return (
        <Dropdown as={ButtonGroup} className="me-2">
            <Button
                variant="secondary"
                disabled={selectedPreset === ""}
                onClick={() => {
                    const filename = builtinPresets[selectedPreset];
                    if (!filename) {
                        console.error(`Unknown builtin preset: ${JSON.stringify(selectedPreset)}`);
                        return;
                    }

                    const url = builtinPresetBaseUrl + filename;
                    fetch(url)
                        .then((resp) => {
                            // eslint-disable-next-line @typescript-eslint/only-throw-error
                            if (!resp.ok) throw `${resp.status.toString()} ${resp.statusText}`;
                            return resp.json();
                        })
                        .then((presetData) => {
                            $preset.set(Preset.schema.parse(presetData));
                            clearGameState();
                            $toast.set({ header: "Preset loaded", variant: "success" });
                        })
                        .catch((error: unknown) => {
                            console.error("Failed to load builtin preset:", error);
                            $toast.set({
                                header: "Failed to load builtin preset",
                                body: toString(error),
                                variant: "danger",
                            });
                        });
                }}
            >
                {selectedPreset ? `Load ${selectedPreset}` : "Select builtin"}
            </Button>
            <Dropdown.Toggle split variant="secondary" />
            <Dropdown.Menu>
                {Object.keys(builtinPresets).map((name) => (
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
    const preset = useStore($preset);
    return (
        <>
            <span className="flex-fill">Current preset: {preset.name}</span>
            <BuiltinPresetSelect />
            <Button variant="primary" onClick={onPresetPaste}>
                Paste
            </Button>
        </>
    );
}

export function AnswerTimeInput({ photo = false }: { photo?: boolean | undefined }) {
    const store = photo ? $photoAnswerTime : $answerTime;
    const time = useStore(store);
    const helper = photo ? (
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
    ) : null;
    return (
        <InputGroup className="mb-2">
            <InputGroup.Text className="column-gap-1">
                {photo ? "Photo question answer time" : "Other question answer time"} {helper}
            </InputGroup.Text>
            <Form.Control
                type="number"
                min="0"
                step="1"
                defaultValue={time}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) store.set(num);
                }}
            />
            <InputGroup.Text>min</InputGroup.Text>
        </InputGroup>
    );
}

export function QuickAnswerMultiplierInput() {
    const multiplier = useStore($quickAnswerMultiplier);
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
                type="number"
                min="0"
                step="0.1"
                defaultValue={multiplier}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $quickAnswerMultiplier.set(num);
                }}
            />
        </InputGroup>
    );
}

export function HidingZoneRadiusInput() {
    const hidingZoneRadius = useStore($hidingZoneRadius);

    return (
        <InputGroup className="mb-2">
            <InputGroup.Text>Hiding zone radius</InputGroup.Text>
            <Form.Control
                type="number"
                min="0"
                step="0.1"
                value={hidingZoneRadius}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $hidingZoneRadius.set(num);
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}

export function CirclePrecisionInput() {
    const circlePrecision = useStore($circlePrecision);

    return (
        <InputGroup className="mb-2">
            <InputGroup.Text>Circle Precision</InputGroup.Text>
            <Form.Control
                type="number"
                min="16"
                step="1"
                value={circlePrecision}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $circlePrecision.set(num);
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}

export function ShowHidingZonesInput() {
    const showHidingZones = useStore($showHidingZones);
    return (
        <InputGroup className="mb-2">
            <InputGroup.Text>Show hiding zones</InputGroup.Text>
            <span className="flex-fill"></span>
            <Button
                variant={showHidingZones ? "success" : "outline-success"}
                onClick={() => {
                    $showHidingZones.set(true);
                }}
            >
                <i className="bi bi-check" />
            </Button>
            <Button
                variant={showHidingZones ? "outline-danger" : "danger"}
                onClick={() => {
                    $showHidingZones.set(false);
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
                <CirclePrecisionInput />
            </ListGroup.Item>
            <ListGroup.Item className="d-flex align-items-center">
                <PresetInput />
            </ListGroup.Item>
        </ListGroup>
    );
}
