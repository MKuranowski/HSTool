// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { Position } from "geojson";
import { BinaryDistanceQuestion } from "./binary";

export class RadarQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    seeker: Position;
    radius: number;

    constructor(seeker: Position, radius: number) {
        super("hit", "miss");
        this.seeker = seeker;
        this.radius = radius;
    }

    get kind(): "radar" {
        return "radar";
    }

    get name(): string {
        return `Radar ${this.radius.toFixed(1)} km`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.distance(pos, this.seeker) - this.radius;
    }

    static empty(seeker: Position): RadarQuestion {
        return new RadarQuestion(seeker, 5);
    }
}
