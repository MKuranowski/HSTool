// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import type { PropertiesWithID } from "../schema";
import { BinaryDistanceQuestion } from "./binary";

export class MatchAreaQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    area: Feature<Polygon | MultiPolygon, PropertiesWithID>;

    constructor(area: Feature<Polygon | MultiPolygon, PropertiesWithID>) {
        super("hit", "miss");
        this.area = area;
    }

    get kind(): "match-area" {
        return "match-area";
    }

    get name(): string {
        return `Match: ${this.area.properties.name ?? this.area.properties.id}`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.pointToPolygonDistance(pos, this.area);
    }
}
