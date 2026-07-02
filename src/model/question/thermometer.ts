// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, computed, type ReadonlySignal, Signal } from "@preact/signals-react";
import * as turf from "@turf/turf";
import type { BBox, FeatureCollection } from "geojson";
import { withAnswers } from "../../helper/answer.ts";
import { nearestPointsToCircle } from "../../helper/geo/dist.ts";
import { voronoi } from "../../helper/geo/voronoi.ts";
import type { Area } from "../geo.ts";
import type { Answer, Answered } from "../props.ts";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";
import {
    WithDistance,
    type WithDistanceParams,
    WithSeekers,
    type WithSeekersParams,
} from "./mixin.ts";

const ANSWERS: ReadonlySignal<readonly ["colder", "hotter"]> = new Signal(["colder", "hotter"]);

export interface ThermometerQuestionParams
    extends BaseQuestionParams, WithSeekersParams, WithDistanceParams {
    azimuth?: number | undefined;
}

/**
 * Thermometer question, with seekers **starting** at {@link seekers}, travelling {@link distance}
 * along a rhumb line of {@link azimuth}.
 *
 * The answer is "hotter" if hiders are closer to {@link endLocation} than to {@link seekers}
 * starting point, "colder" otherwise.
 *
 * TODO: The implementation should be changed from a rhumb line to a great circle arc.
 */
export default class ThermometerQuestion extends WithDistance(WithSeekers(BaseQuestion)) {
    override readonly kind = "thermometer";
    override readonly name = computed(() => `Thermometer: ${this.distance.value.toString()} km`);
    override readonly answers = ANSWERS;

    /** Azimuth (direction) of the thermometer, in degrees (0 to 360). */
    readonly azimuth: Signal<number>;

    constructor(p: ThermometerQuestionParams = {}) {
        super(p);
        this.azimuth = new Signal(p.azimuth ?? 90);
    }

    /** End location of the thermometer. */
    readonly endLocation = computed(() => {
        // NOTE: turf.transformTranslate moves along rhumb lines.
        return turf.transformTranslate(
            turf.point(this.seekers.value),
            this.distance.value,
            this.azimuth.value,
        ).geometry.coordinates as [lon: number, lat: number];
    });

    /**
     * Updates the azimuth of the thermometer, so that the thermometer points toward
     * the provided end location.
     *
     * If `overrideDistance` is set, the distance is updated as well, such that the thermometer
     * actually ends at the provided end location.
     */
    setEndLocation(
        end: [lon: number, lat: number],
        { overrideDistance = false }: { overrideDistance?: boolean | undefined } = {},
    ): void {
        batch(() => {
            this.azimuth.value = turf.bearingToAzimuth(turf.bearing(this.seekers.value, end));
            if (overrideDistance) this.distance.value = turf.distance(this.seekers.value, end);
        });
    }

    /**
     * Updates the azimuth of the thermometer.
     */
    setAzimuth(newAzimuth: number): void {
        this.azimuth.value = newAzimuth;
    }

    /** FeatureCollection of the start and end locations. */
    readonly #candidates = computed(() =>
        turf.featureCollection([
            turf.point(this.seekers.value, { id: "colder" }),
            turf.point(this.endLocation.value, { id: "hotter" }),
        ])
    );

    override categorize(center: turf.helpers.Coord, radius: number): Answer[] {
        return nearestPointsToCircle(this.#candidates.value, center, radius).features.map((pt) => ({
            id: pt.properties.id,
        }));
    }

    override divideArea(extent: BBox): FeatureCollection<Area, Answered> | null {
        return withAnswers(voronoi(this.#candidates.value, { extent }), (f) => ({
            id: f.properties.id,
        }));
    }
}
