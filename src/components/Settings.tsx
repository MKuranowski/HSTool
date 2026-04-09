// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { Button, Form, InputGroup, ListGroup } from "react-bootstrap";
import { zodJson } from "../helper/store";
import { toString } from "../helper/strings";
import * as Preset from "../model/Preset";
import { $hidingZoneRadius, $preset, $toast } from "../state";

const presetSchemaJson = zodJson(Preset.schema);

function onPresetPaste(): void {
    navigator.clipboard
        .readText()
        .then((content) => {
            $preset.set(presetSchemaJson.decode(content));
        })
        .catch((error: unknown) => {
            console.log("Failed to read preset from clipboard:", error);
            $toast.set({
                header: "Failed to read preset",
                body: toString(error),
                variant: "danger",
            });
        });
}

export function PresetInput() {
    const preset = useStore($preset);
    return (
        <>
            <span className="flex-fill">Current preset: {preset.name}</span>
            <Button variant="primary" onClick={onPresetPaste}>
                Paste
            </Button>
        </>
    );
}

export function HidingZoneRadiusInput() {
    const hidingZoneRadius = useStore($hidingZoneRadius);

    return (
        <InputGroup>
            <InputGroup.Text>Hiding zone radius (km)</InputGroup.Text>
            <Form.Control
                type="number"
                min="0"
                step="0.1"
                defaultValue={hidingZoneRadius}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(num)) $hidingZoneRadius.set(num);
                }}
            />
        </InputGroup>
    );
}

export default function Settings() {
    return (
        <ListGroup>
            <ListGroup.Item className="d-flex align-items-center">
                <PresetInput />
            </ListGroup.Item>
            <ListGroup.Item>
                <HidingZoneRadiusInput />
            </ListGroup.Item>
        </ListGroup>
    );
}
