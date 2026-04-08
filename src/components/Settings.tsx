// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { Button, ListGroup } from "react-bootstrap";
import { zodJson } from "../helper/store";
import { toString } from "../helper/strings";
import * as Preset from "../model/Preset";
import { $preset, $toast } from "../state";

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

export default function Settings() {
    const preset = useStore($preset);

    return (
        <ListGroup>
            <ListGroup.Item className="d-flex align-items-center">
                <span className="flex-fill">Current preset: {preset.name}</span>
                <Button variant="primary" onClick={onPresetPaste}>
                    Paste
                </Button>
            </ListGroup.Item>
        </ListGroup>
    );
}
