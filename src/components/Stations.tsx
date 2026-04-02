// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { $preset } from "../model/state";
import { ListGroup } from "react-bootstrap";
import type { Feature, Point } from "geojson";
import type { PropertiesWithName } from "../model/schema";

function Station({ station }: { station: Feature<Point, PropertiesWithName> }) {
    return <ListGroup.Item key={station.properties.id}>{station.properties.name}</ListGroup.Item>;
}

export default function Stations() {
    const preset = useStore($preset);
    return <ListGroup>{preset.stations.features.map((station) => Station({ station }))}</ListGroup>;
}
