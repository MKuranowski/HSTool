// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { question as schema } from "./schema";
import { expect, test } from "vitest";
import zodJson from "../../helper/zodJson";
import { RadarQuestion } from "./radar";
import { ThermometerQuestion } from "./thermometer";

const jsonSchema = zodJson(schema);

test("schema.decode", () => {
    const o = jsonSchema.decode('{"kind":"radar","seeker":[13.4,52.5],"radius":10}');
    expect(o).toBeInstanceOf(RadarQuestion);
    expect((o as RadarQuestion).seeker).toEqual([13.4, 52.5]);
    expect((o as RadarQuestion).radius).toEqual(10.0);
});

test("schema.encode", () => {
    const o = jsonSchema.encode(new ThermometerQuestion([21.0, 52.2], [13.4, 52.5]));
    expect(o).toEqual('{"kind":"thermometer","start":[21,52.2],"end":[13.4,52.5]}');
});
