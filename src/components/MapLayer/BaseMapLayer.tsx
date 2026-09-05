// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import * as L from "leaflet";
import { TileLayer } from "react-leaflet";
import $ from "../../state.ts";

const CARTO_KEY = "cb1_2xr2_1_3a2facbc8ad1f7b11a7c4c8b";

export default function BaseMapLayer() {
    useSignals();

    const scale = L.Browser.retina ? "@2x" : "";
    switch ($.preferences.baseMapStyle.value) {
        case "osm-carto":
            return (
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                    noWrap
                />
            );

        case "carto-voyager":
            return (
                <TileLayer
                    url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${scale}.png?key=${CARTO_KEY}`}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={20}
                    noWrap
                />
            );

        case "carto-light":
            return (
                <TileLayer
                    url={`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}${scale}.png?key=${CARTO_KEY}`}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={20}
                    noWrap
                />
            );

        case "carto-dark":
            return (
                <TileLayer
                    url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${scale}.png?key=${CARTO_KEY}`}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={20}
                    noWrap
                />
            );
    }
}
