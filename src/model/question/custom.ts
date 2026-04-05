// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Position } from "geojson";
import { Question } from "./base";

export class CustomQuestion extends Question<null> {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    get kind(): "custom" {
        return "custom";
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    categorizePoint(_pos: Position, _tolerance: number): null {
        return null;
    }
}
