// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later
/// <reference lib="deno.ns" />

import { expect } from "@std/expect";
import { stub } from "@std/testing/mock";
import Timestamp from "./timestamp.ts";

Deno.test("Timestamp.timezones", () => {
    const originalEnv = Deno.env.get;
    const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "TZ") return "Asia/Tokyo";
        return originalEnv(key);
    });

    try {
        const local = new Timestamp("2026-04-10T17:15");
        expect(local.t.value.toISOString(), "2026-04-10T08:15:00.000Z");

        const utc = new Timestamp("2026-04-10T08:15:00Z");
        expect(utc.formValue.value, "2026-04-10T17:15");

        expect(() => new Timestamp("Wed, 1 Apr 2026 08:15:30 GMT")).toThrow("invalid timestamp");
    } finally {
        envStub.restore();
    }
});
