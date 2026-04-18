// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

export { bufferBBox, isArea, isMultiPolygon, isPolygon, soleDivision } from "./area";
export { distanceToFeature, nearestPointsToCircle } from "./dist";
export {
    binaryCategorizer,
    mergePositions,
    withPossibleAnswers,
    withProperties,
    withPropertiesInCollection,
} from "./prop";
export { voronoi } from "./voronoi";
