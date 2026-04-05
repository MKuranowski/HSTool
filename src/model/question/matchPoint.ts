// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Point, Position } from "geojson";
import type { PropertiesWithID } from "../schema";
import { BinaryDistanceQuestion } from "./binary";

export interface NearestPointProperties extends PropertiesWithID {
    featureIndex: number;
    distanceToPoint: number;
}

export class MatchPointQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    presetName: string;
    candidates: FeatureCollection<Point, PropertiesWithID>;

    #seeker: Position;
    #closest: Feature<Point, NearestPointProperties>;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point, PropertiesWithID>,
        seeker: Position,
    ) {
        super("hit", "miss");
        this.presetName = presetName;
        this.candidates = candidates;
        this.#seeker = seeker;
        this.#closest = turf.nearestPoint(seeker, this.candidates);
    }

    get kind(): "match-point" {
        return "match-point";
    }

    get name(): string {
        return `Match ${this.presetName}`;
    }

    get seeker(): Position {
        return this.#seeker;
    }

    set seeker(pos: Position) {
        this.#seeker = pos;
        this.#closest = turf.nearestPoint(pos, this.candidates);
    }

    get closest(): Feature<Point, NearestPointProperties> {
        return this.#closest;
    }

    calculateDistanceDelta(pos: Position): number {
        const distances = this.candidates.features.map((c) => turf.distance(pos, c));
        const [distanceToMatched] = distances.splice(this.#closest.properties.featureIndex, 1);
        const distanceToOther = Math.min(...distances);
        return distanceToMatched - distanceToOther;
    }
}
