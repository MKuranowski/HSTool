// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { $preset, $toast } from "../model/state";
import { Button, ListGroup } from "react-bootstrap";
import * as schema from "../model/schema";
import { toString } from "../helper/strings";

function onPresetPaste(): void {
    navigator.clipboard
        .readText()
        .then((content) => {
            $preset.set(schema.preset.parse(JSON.parse(content)));
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
