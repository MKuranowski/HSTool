// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Signal } from "@preact/signals-react";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
import { ReactNode } from "react";
import { Button, InputGroup } from "react-bootstrap";

export default function BooleanSetting({ label, signal, className = "" }: {
    label: ReactNode;
    signal: Signal<boolean>;
    className?: string | undefined;
}) {
    const yesRef = useSignalRef<HTMLButtonElement | null>(null);
    const noRef = useSignalRef<HTMLButtonElement | null>(null);

    useSignalEffect(() => {
        if (signal.value) {
            if (yesRef.current) yesRef.current.className = "btn btn-success";
            if (noRef.current) noRef.current.className = "btn btn-outline-danger";
        } else {
            if (yesRef.current) yesRef.current.className = "btn btn-outline-success";
            if (noRef.current) noRef.current.className = "btn btn-danger";
        }
    });

    const enabled = signal.peek();
    return (
        <InputGroup className={`justify-content-center ${className}`.trim()}>
            <InputGroup.Text>{label}</InputGroup.Text>
            <Button
                ref={yesRef}
                variant={enabled ? "success" : "outline-success"}
                onClick={() => {
                    signal.value = true;
                }}
            >
                <i className="bi bi-check" />
            </Button>
            <Button
                ref={noRef}
                variant={enabled ? "outline-danger" : "danger"}
                onClick={() => {
                    signal.value = false;
                }}
            >
                <i className="bi bi-x" />
            </Button>
        </InputGroup>
    );
}
