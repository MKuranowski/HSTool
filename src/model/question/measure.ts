// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { FeatureCollection, LineString, Point, Position } from "geojson";
import { distanceToFeature } from "../../helper/geo";
import type { PropertiesWithID } from "../schema";
import { BinaryDistanceQuestion } from "./binary";

export class MeasureQuestion extends BinaryDistanceQuestion<"closer", "further"> {
    presetName: string;
    candidates: FeatureCollection<Point | LineString, PropertiesWithID>;
    #seeker: Position;
    #distance: number;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point | LineString, PropertiesWithID>,
        seeker: Position,
    ) {
        super("closer", "further");
        this.presetName = presetName;
        this.candidates = candidates;
        this.#seeker = seeker;
        this.#distance = Math.min(...candidates.features.map((f) => distanceToFeature(seeker, f)));
    }

    get kind(): "measure" {
        return "measure";
    }

    get name(): string {
        return `Measure ${this.presetName}`;
    }

    get seeker(): Position {
        return this.#seeker;
    }

    set seeker(pos: Position) {
        this.#seeker = pos;
        this.#distance = Math.min(
            ...this.candidates.features.map((f) => distanceToFeature(pos, f)),
        );
    }

    get distance(): number {
        return this.#distance;
    }

    calculateDistanceDelta(pos: Position): number {
        const distance = Math.min(
            ...this.candidates.features.map((f) => distanceToFeature(pos, f)),
        );
        return distance - this.#distance;
    }

    static empty(seeker: Position): MeasureQuestion {
        return new MeasureQuestion("Empty", turf.featureCollection([]), seeker);
    }
}
