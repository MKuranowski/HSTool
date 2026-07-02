// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { Toast, ToastContainer } from "react-bootstrap";
import $ from "../state.ts";

export default function ToastManager() {
    useSignals();
    const toast = $.toast.value;
    const element =
        toast !== null ? (
            <Toast
                bg={toast.variant}
                onClose={() => {
                    $.toast.value = null;
                }}
                delay={5000}
                autohide
            >
                <Toast.Header>
                    <strong>{toast.header}</strong>
                </Toast.Header>
                {toast.body ? <Toast.Body>{toast.body}</Toast.Body> : <></>};
            </Toast>
        ) : (
            <></>
        );

    return <ToastContainer className="fixed-top m-1">{element}</ToastContainer>;
}
