// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type {
    Feature,
    FeatureCollection,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from "geojson";
import * as turf from "@turf/turf";

export interface Properties {
    id: string;
    name?: string | undefined;
    [name: string]: unknown;
}

export type QuestionKind = "match" | "measure" | "radar" | "thermometer" | "tentacles" | "custom";

export abstract class Question<Answer extends string | null = string | null> {
    answer: Answer | null = null;

    abstract get kind(): QuestionKind;
    abstract get name(): string;
    abstract categorizePoint(pos: Position, tolerance: number): Answer | null;
}

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

export abstract class BinaryDistanceQuestion<
    NegativeAnswer extends string,
    PositiveAnswer extends string,
> extends Question<NegativeAnswer | PositiveAnswer> {
    #negativeAnswer: NegativeAnswer;
    #positiveAnswer: PositiveAnswer;

    constructor(negativeAnswer: NegativeAnswer, positiveAnswer: PositiveAnswer) {
        super();
        this.#negativeAnswer = negativeAnswer;
        this.#positiveAnswer = positiveAnswer;
    }

    abstract calculateDistanceDelta(pos: Position): number;

    categorizePoint(pos: Position, tolerance: number): NegativeAnswer | PositiveAnswer | null {
        const delta = this.calculateDistanceDelta(pos);

        if (Math.abs(delta) <= tolerance) return null;
        return delta < 0 ? this.#negativeAnswer : this.#positiveAnswer;
    }
}

export class MatchAreaQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    area: Feature<Polygon | MultiPolygon, Properties>;

    constructor(area: Feature<Polygon | MultiPolygon, Properties>) {
        super("hit", "miss");
        this.area = area;
    }

    get kind(): "match" {
        return "match";
    }

    get name(): string {
        return `Match: ${this.area.properties.name ?? this.area.properties.id}`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.pointToPolygonDistance(pos, this.area);
    }
}

export class MatchPointQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    presetName: string;
    candidates: FeatureCollection<Point, Properties>;

    #seeker: Position;
    #closest: Feature<Point, Properties & { distanceToPoint: number }>;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point, Properties>,
        seeker: Position,
    ) {
        super("hit", "miss");
        this.presetName = presetName;
        this.candidates = candidates;
        this.#seeker = seeker;
        this.#closest = turf.nearestPoint(seeker, this.candidates);
    }

    get kind(): "match" {
        return "match";
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

    get closest(): Feature<Point, Properties & { distanceToPoint: number }> {
        return this.#closest;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.distance(this.#closest, pos) - this.#closest.properties.distanceToPoint;
    }
}

export class MeasureQuestion extends BinaryDistanceQuestion<"closer", "further"> {
    presetName: string;
    candidates: FeatureCollection<Point | LineString, Properties>;
    #seeker: Position;
    #distance: number;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point | LineString, Properties>,
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
}

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
}

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
        return turf.distance(pos, this.end) - turf.distance(pos, this.start);
    }
}

export class TentaclesQuestion extends Question<string> {
    presetName: string;
    candidates: FeatureCollection<Point, Properties>;
    #radius: number;
    #seeker: Position;
    #voronoi: FeatureCollection<Polygon | MultiPolygon, Properties>;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point, Properties>,
        radius: number,
        seeker: Position,
    ) {
        super();
        this.presetName = presetName;
        this.candidates = candidates;
        this.#radius = radius;
        this.#seeker = seeker;
        this.#voronoi = this.calculateVoronoi();
    }

    private calculateVoronoi(): FeatureCollection<Polygon | MultiPolygon, Properties> {
        const circle = turf.buffer(turf.point(this.#seeker), this.#radius);
        if (circle === undefined) throw new Error("turf.buffer: undefined around seeker location");

        const viableCandidates = turf.featureCollection(
            this.candidates.features.filter((f) => turf.distance(f, this.#seeker) < this.#radius),
        );

        const voronoi = turf.toWgs84(
            turf.voronoi(turf.toMercator(viableCandidates), {
                bbox: turf.bbox(turf.toMercator(circle)),
            }),
        );

        if (voronoi.features.length !== viableCandidates.features.length)
            throw new Error(
                `turf.voronoi: from ${viableCandidates.features.length.toFixed()} features ` +
                    `gave only ${voronoi.features.length.toFixed()} areas`,
            );

        return turf.featureCollection(
            voronoi.features
                .map((voronoiArea, i) => {
                    const point = viableCandidates.features[i];

                    if (!turf.booleanContains(voronoiArea, point))
                        throw new Error(
                            `turf.voronoi: area at index ${i.toFixed(0)} ` +
                                "does not contain feature from the same index",
                        );

                    return turf.intersect(turf.featureCollection([voronoiArea, circle]), {
                        properties: point.properties,
                    });
                })
                .filter((f) => f !== null),
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
        this.#voronoi = this.calculateVoronoi();
    }

    get radius(): number {
        return this.#radius;
    }

    set radius(r: number) {
        this.#radius = r;
        this.#voronoi = this.calculateVoronoi();
    }

    get voronoi(): FeatureCollection<Polygon | MultiPolygon, Properties> {
        return this.#voronoi;
    }

    categorizePoint(pos: Position, tolerance: number): string {
        const matches: string[] = [];

        // Check if miss is possible
        if (turf.distance(pos, this.#seeker) + tolerance > this.#radius) {
            matches.push("(nil)");
        }

        // Add matches if the circle around provided position intersects the area determined
        // by the voronoi diagram
        const posBuffer = tolerance > 0 ? turf.circle(turf.point(pos), tolerance) : turf.point(pos);
        for (const area of this.#voronoi.features) {
            if (turf.booleanIntersects(area, posBuffer)) {
                matches.push(area.properties.id);
            }
        }

        return matches.join(";");
    }
}

function distanceToFeature(
    pt: Position,
    f: Feature<Point | LineString | Polygon | MultiPolygon>,
): number {
    switch (f.geometry.type) {
        case "Point":
            return turf.distance(pt, f.geometry.coordinates);

        case "LineString":
            return turf.pointToLineDistance(pt, f.geometry);

        case "Polygon":
        case "MultiPolygon":
            return turf.pointToPolygonDistance(pt, f.geometry);
    }
}
