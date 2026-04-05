// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { Toast, ToastContainer } from "react-bootstrap";
import { $toast } from "../model/state";

export default function ToastManager() {
    const content = useStore($toast);
    const element =
        content !== null ? (
            <Toast
                bg={content.variant}
                onClose={() => {
                    $toast.set(null);
                }}
                delay={5000}
                autohide
            >
                <Toast.Header>
                    <strong>{content.header}</strong>
                </Toast.Header>
                <Toast.Body>{content.body}</Toast.Body>
            </Toast>
        ) : (
            <></>
        );

    return <ToastContainer className="fixed-top m-1">{element}</ToastContainer>;
}
