// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
import { useState } from "react";
import { Button, ButtonGroup, Dropdown, Form, InputGroup } from "react-bootstrap";
import { loadPresetFromUrl } from "../../helper/builtinPresets.ts";
import { toString } from "../../helper/strings.ts";
import $, { jsonCodec } from "../../state.ts";
import { presetSchema } from "../../wire/preset.ts";

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

function LoadPresetInput() {
    const input = useSignalRef<HTMLInputElement | null>(null);

    useSignalEffect(() => {
        if (input.current && $.preset.name.value !== input.current.value) {
            input.current.value = $.preset.name.value;
        }
    });

    return (
        <InputGroup>
            <InputGroup.Text>Current preset</InputGroup.Text>
            <Form.Control ref={input} disabled />
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
        </InputGroup>
    );
}

function GameStateReset() {
    return (
        <div className="d-flex justify-content-center mb-2">
            <Button
                variant="danger"
                onClick={() => {
                    if (window.confirm("Do you want to reset the game state?")) {
                        $.clearGame();
                    }
                }}
            >
                Reset Game State
            </Button>
        </div>
    );
}

export default function PresetInput() {
    return (
        <>
            <GameStateReset />
            <LoadPresetInput />
        </>
    );
}
