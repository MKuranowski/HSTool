// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed, type ReadonlySignal, Signal } from "@preact/signals-react";
import * as turf from "@turf/turf";
import type {
    BBox,
    Feature,
    FeatureCollection,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import { categorizeBinary } from "../../helper/answer.ts";
import { isArea, isMultiPolygon, soleDivision } from "../../helper/geo/area.ts";
import { distanceToFeature } from "../../helper/geo/dist.ts";
import type { Area } from "../geo.ts";
import type { Answer, Answered } from "../props.ts";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";
import {
    WithCandidates,
    type WithCandidatesParams,
    WithSeekers,
    type WithSeekersParams,
} from "./mixin.ts";

const ANSWERS: ReadonlySignal<readonly ["closer", "further"]> = new Signal(["closer", "further"]);

export interface MeasureQuestionParams
    extends BaseQuestionParams, WithSeekersParams, WithCandidatesParams<Point | LineString> {}

/**
 * Measuring question. The answer is "closer" if hiders are closer to any candidate feature than
 * seekers are to their closest candidate feature,"further" otherwise.
 */
export default class MeasureQuestion extends WithCandidates(
    WithSeekers(BaseQuestion),
    "Point",
    "LineString",
) {
    override readonly kind = "measure";
    override readonly name = computed(() => `Measure: ${this.candidatesName.value}`);
    override readonly answers = ANSWERS;

    constructor(p: MeasureQuestionParams = {}) {
        super(p);
    }

    /** Distance from the seekers to their nearest candidate feature */
    readonly seekerDistance = computed(() => this.calcDistance(this.seekers.value));

    /** Calculates the distance from the provided point to the nearest candidate feature */
    calcDistance(pt: turf.Coord): number {
        return Math.min(...this.candidates.value.features.map((f) => distanceToFeature(pt, f)));
    }

    override categorize(center: turf.helpers.Coord, radius: number): Answer[] {
        const zoneDistance = this.calcDistance(center);
        return categorizeBinary(
            zoneDistance - this.seekerDistance.value,
            radius,
            { id: "closer" },
            { id: "further" },
        );
    }

    override divideArea(
        extent: BBox,
        circlePrecision: number = 512,
    ): FeatureCollection<Area, Answered> | null {
        // turf.buffer is notoriously slow, so scale down the precision
        const steps = Math.min(circlePrecision, Math.round(Math.sqrt(32 * circlePrecision)));

        const buffers = turf.featureCollection(
            this.candidates.value.features.map((f) =>
                bufferFeature(f, this.seekerDistance.value, { steps })
            ).filter((f) => f !== undefined),
        );
        if (buffers === undefined || buffers.features.length === 0) {
            return soleDivision(extent, { id: "further" });
        }

        const buffer = buffers.features.length > 1 ? turf.union(buffers) : buffers.features[0];
        if (buffer === null) return soleDivision(extent, { id: "further" });

        const closer = turf.bboxClip(buffer, extent);
        if (!isArea(closer)) return soleDivision(extent, { id: "further" });

        /// HOTFIX: turf.bboxClip can simply return a `[]` polygon, which breaks turf.difference
        if (isMultiPolygon(closer)) {
            closer.geometry.coordinates = closer.geometry.coordinates.filter(
                (polygon) => polygon.length > 0,
            );
        }

        const extentPolygon = turf.bboxPolygon(extent);
        const further = turf.difference(turf.featureCollection<Area>([extentPolygon, closer]));
        if (further === null) return soleDivision(extent, { id: "closer" });

        return turf.featureCollection([
            { ...closer, properties: { id: "closer", answer: { id: "closer" } } },
            { ...further, properties: { id: "further", answer: { id: "further" } } },
        ]);
    }
}

type BufferOptions = Parameters<typeof turf.buffer>[2];

function bufferFeature(
    f: Feature,
    radius: number,
    options?: BufferOptions,
): Feature<Polygon | MultiPolygon> | undefined {
    // Workaround https://github.com/Turfjs/turf/issues/2929 by converting closed LineStrings
    // to Polygons before buffering.
    f = isClosedLineString(f) ? turf.lineToPolygon(f) : f;
    return turf.buffer(f, radius, options);
}

function isClosedLineString(f: Feature): f is Feature<LineString> {
    return f.geometry.type === "LineString" && f.geometry.coordinates.length >= 4 &&
        f.geometry.coordinates[0][0] === f.geometry.coordinates.at(-1)![0] &&
        f.geometry.coordinates[0][1] === f.geometry.coordinates.at(-1)![1];
}
