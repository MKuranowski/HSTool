// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Timestamp from "./timestamp.ts";

beforeEach(() => {
    vi.stubEnv("TZ", "Asia/Tokyo");
});

afterEach(() => {
    vi.unstubAllEnvs();
});

test("Timestamp.timezones", () => {
    const local = new Timestamp("2026-04-10T17:15");
    expect(local.t.value.toISOString(), "2026-04-10T08:15:00.000Z");

    const utc = new Timestamp("2026-04-10T08:15:00Z");
    expect(utc.formValue.value, "2026-04-10T17:15");

    expect(() => new Timestamp("Wed, 1 Apr 2026 08:15:30 GMT")).toThrow("invalid timestamp");
});
