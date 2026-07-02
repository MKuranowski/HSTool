// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* any is required for mixin classes */

import { batch, Signal } from "@preact/signals-react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryOf, GeometryTypes, Position } from "../geo.ts";
import type { Identified } from "../props.ts";
import BaseQuestion from "./base.ts";

type Constructor<T extends object> = abstract new (...args: any[]) => T;

/** Constructor parameters used by the {@link WithSeekers} mixin. */
export interface WithSeekersParams {
    seekers?: Position | undefined;
}

/**
 * Amends a class with a SeekersMixin, providing the common property of seekers' location.
 */
export function WithSeekers<TBase extends Constructor<BaseQuestion>>(Base: TBase) {
    abstract class SeekersMixin extends Base {
        /** Seekers location */
        readonly seekers: Signal<Position>;

        constructor(...args: any[]) {
            super(...args);

            const params: WithSeekersParams = args[0] ?? {};
            this.seekers = new Signal(params.seekers ?? [0, 0]);
        }

        /**
         * Updates the [seekers location]{@link seekers} with the provided coordinates.
         *
         * Undefined entries in the provided array are replaced by current values.
         */
        setSeekers(newPosition: [lon: number | undefined, lat: number | undefined]) {
            this.seekers.value = [
                newPosition[0] ?? this.seekers.value[0],
                newPosition[1] ?? this.seekers.value[1],
            ];
        }
    }
    return SeekersMixin;
}

/** Constructor parameters used by the {@link WithDistance} mixin. */
export interface WithDistanceParams {
    distance?: number | undefined;
}

/**
 * Amends a class with a DistanceMixin, providing the common property of an effective
 * question distance.
 */
export function WithDistance<TBase extends Constructor<BaseQuestion>>(Base: TBase) {
    abstract class DistanceMixin extends Base {
        /** Effective distance of the question, in kilometers. */
        readonly distance: Signal<number>;

        constructor(...args: any[]) {
            super(...args);

            const params: WithDistanceParams = args[0] ?? {};
            this.distance = new Signal(params.distance ?? 5);
        }

        setDistance(newDistance: number): void {
            this.distance.value = newDistance;
        }
    }
    return DistanceMixin;
}

/** Constructor parameters used by the {@link WithCandidates} mixin. */
export interface WithCandidatesParams<G extends Geometry> {
    candidates?: FeatureCollection<G, Identified> | undefined;
    candidatesName?: string | undefined;
}

/**
 * Amends a class with a CandidatesMixin, providing the common property of a set of
 * candidate features.
 */
export function WithCandidates<TBase extends Constructor<BaseQuestion>, G extends GeometryTypes>(
    Base: TBase,
    ...allowedGeometries: G
) {
    abstract class CandidatesMixin extends Base {
        /** All considered candidate features */
        readonly candidates: Signal<Readonly<FeatureCollection<GeometryOf<G>, Identified>>>;

        /** Name of the candidate collection */
        readonly candidatesName: Signal<string>;

        /** List of all allowed geometries. Must contain all allowed types. */
        readonly allowedGeometries = allowedGeometries;

        constructor(...args: any[]) {
            super(...args);

            const params: WithCandidatesParams<GeometryOf<G>> = args[0] ?? {};
            this.candidates = new Signal(
                params.candidates ?? { type: "FeatureCollection", features: [] },
            );
            this.candidatesName = new Signal(params.candidatesName ?? "");
        }

        /**
         * Updates the current set of candidates and the name of the set in one batch.
         */
        setCandidates(
            name: string,
            candidates: FeatureCollection<GeometryOf<G>, Identified>,
        ): void {
            batch(() => {
                this.candidates.value = candidates;
                this.candidatesName.value = name;
            });
        }

        /**
         * Updates the current set of candidates from a collection with runtime-unknown geometries.
         * Features with invalid geometries are silently ignored.
         */
        setAnyCandidates(name: string, candidates: FeatureCollection<Geometry, Identified>): void {
            batch(() => {
                this.candidates.value = {
                    type: "FeatureCollection",
                    features: candidates.features.filter((f) => this.#isFeatureAllowed(f)),
                };
                this.candidatesName.value = name;
            });
        }

        #isFeatureAllowed(f: Feature): f is Feature<GeometryOf<G>> {
            return this.allowedGeometries.includes(f.geometry.type);
        }
    }
    return CandidatesMixin;
}
