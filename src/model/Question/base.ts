// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";
import * as Timestamp from "../Timestamp";

export const schema = z.object({
    askedAt: Timestamp.schema.optional(),
    answeredAt: Timestamp.schema.optional(),
});
