// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { FeatureCollection, Point, Position } from "geojson";
import { Question } from "./base";
import * as turf from "@turf/turf";
import type { PropertiesWithID } from "../schema";

export class TentaclesQuestion extends Question<string> {
    presetName: string;
    candidates: FeatureCollection<Point, PropertiesWithID>;
    #seeker: Position;
    #radius: number;
    #viableCandidates: FeatureCollection<Point, PropertiesWithID>;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point, PropertiesWithID>,
        seeker: Position,
        radius: number,
    ) {
        super();
        this.presetName = presetName;
        this.candidates = candidates;
        this.#seeker = seeker;
        this.#radius = radius;
        this.#viableCandidates = this.calculateViableCandidates();
    }

    private calculateViableCandidates(): FeatureCollection<Point, PropertiesWithID> {
        return turf.featureCollection(
            this.candidates.features.filter((f) => turf.distance(f, this.#seeker) < this.#radius),
        );
    }

    get kind(): "tentacles" {
        return "tentacles";
    }

    get name(): string {
        return `Tentacles ${this.presetName}`;
    }

    get seeker(): Position {
        return this.#seeker;
    }

    set seeker(pos: Position) {
        this.#seeker = pos;
        this.#viableCandidates = this.calculateViableCandidates();
    }

    get radius(): number {
        return this.#radius;
    }

    set radius(r: number) {
        this.#radius = r;
        this.#viableCandidates = this.calculateViableCandidates();
    }

    get viableCandidates(): FeatureCollection<Point, PropertiesWithID> {
        return this.#viableCandidates;
    }

    categorizePoint(pos: Position, tolerance: number): string {
        // Shortcut - without any viable candidates, no non-nil answer is possible
        if (this.#viableCandidates.features.length === 0) return "(nil)";

        // Check if miss is the only possible outcome
        const distanceToRoot = turf.distance(pos, this.#seeker);
        if (distanceToRoot > this.#radius + tolerance) return "(nil)";

        // Check if miss is possible
        const matches: string[] = [];
        if (distanceToRoot >= this.#radius - tolerance) matches.push("(nil)");

        // Check which candidates could be returned
        const distances = this.#viableCandidates.features.map((c) => turf.distance(pos, c));
        const closest = Math.min(...distances);
        matches.push(
            ...this.#viableCandidates.features
                .map((c) => c.properties.id)
                .filter((_, i) => distances[i] <= closest + tolerance),
        );

        return matches.join(";");
    }
}
