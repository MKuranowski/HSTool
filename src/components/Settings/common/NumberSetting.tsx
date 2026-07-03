// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Signal } from "@preact/signals-react";
import { useSignalRef } from "@preact/signals-react/utils";
import { ReactNode } from "react";
import { FormControl, InputGroup } from "react-bootstrap";

export default function NumberSetting({
    label,
    signal,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    step,
    unit,
    integer = false,
    className,
}: {
    label: ReactNode;
    signal: Signal<number>;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    unit?: string | undefined;
    integer?: boolean | undefined;
    className?: string | undefined;
}) {
    const ref = useSignalRef<HTMLInputElement | null>(null);

    useSignalRef(() => {
        if (ref.current && ref.current.valueAsNumber !== signal.value) {
            ref.current.valueAsNumber = signal.value;
            ref.current.classList.remove("is-invalid");
        }
    });

    const isValid = (num: number) => Number.isFinite(num) && num >= min && num <= max;

    return (
        <InputGroup className={className}>
            <InputGroup.Text>{label}</InputGroup.Text>
            <FormControl
                ref={ref}
                type="number"
                min={min}
                max={max}
                step={step}
                defaultValue={signal.peek()}
                onChange={(e) => {
                    const text = e.target.value;
                    const num = integer ? Number.parseInt(text) : Number.parseFloat(text);
                    if (isValid(num)) {
                        signal.value = num;
                        ref.current?.classList.remove("is-invalid");
                    } else {
                        ref.current?.classList.add("is-invalid");
                    }
                }}
            />
            {unit && <InputGroup.Text>{unit}</InputGroup.Text>}
        </InputGroup>
    );
}
