// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { Position } from "geojson";
import { BinaryDistanceQuestion } from "./binary";

export class ThermometerQuestion extends BinaryDistanceQuestion<"colder", "hotter"> {
    start: Position;
    end: Position;

    constructor(start: Position, end: Position) {
        super("colder", "hotter");
        this.start = start;
        this.end = end;
    }

    get kind(): "thermometer" {
        return "thermometer";
    }

    get name(): string {
        const distance = turf.distance(this.start, this.end);
        return `Thermometer ${distance.toFixed(1)} km`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.distance(pos, this.start) - turf.distance(pos, this.end);
    }

    static empty(seeker: Position): ThermometerQuestion {
        const end = turf.transformTranslate(turf.point(seeker), 1, 90).geometry.coordinates;
        return new ThermometerQuestion(seeker, end);
    }
}
