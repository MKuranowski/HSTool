// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import "./styles.scss";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.tsx";

const root = document.getElementById("root");
if (root === null) {
    throw new Error("No <div id='root'> element found - failed to render the app");
} else {
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
