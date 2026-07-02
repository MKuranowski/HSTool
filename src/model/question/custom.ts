// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { type ReadonlySignal, Signal } from "@preact/signals-react";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";

const NO_ANSWERS: ReadonlySignal<readonly never[]> = new Signal([]);

export interface CustomQuestionParams extends BaseQuestionParams {
    name?: string | undefined;
}

/**
 * Custom, user-provided question. Does not provide any answers, categorization
 * or division; the only editable property is its name.
 */
export default class CustomQuestion extends BaseQuestion {
    override readonly kind = "custom";
    override readonly name: Signal<string>;
    override readonly answers = NO_ANSWERS;

    constructor(p: CustomQuestionParams = {}) {
        super(p);
        this.name = new Signal(p.name ?? "");
    }
}
