// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import "./FormStack.scss";
import type { HTMLAttributes, ReactNode } from "react";
import { InputGroup } from "react-bootstrap";

export interface FormStackRowProps extends HTMLAttributes<HTMLDivElement> {
    label?: ReactNode | undefined;
}

function Row({ label, children, className = "", ...props }: FormStackRowProps) {
    return (
        <div className={`stack-row ${className}`.trim()} {...props}>
            <InputGroup.Text className="stack-label">{label}</InputGroup.Text>
            <InputGroup className="stack-controls">{children}</InputGroup>
        </div>
    );
}

export default function FormStack({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`form-stack ${className}`.trim()} {...props}>
            {children}
        </div>
    );
}

FormStack.Row = Row;
