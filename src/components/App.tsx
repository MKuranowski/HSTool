// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Tab, Tabs } from "react-bootstrap";
import GameMap from "./GameMap.tsx";
import Questions from "./Questions.tsx";
import Settings from "./Settings/index.tsx";
import Stations from "./Stations.tsx";
import Timing from "./Timing.tsx";
import ToastManager from "./ToastManager.tsx";

function App() {
    return (
        <>
            <ToastManager />
            <div className="app-container">
                <GameMap />
                <div className="tabs">
                    <Tabs defaultActiveKey="questions">
                        <Tab eventKey="questions" title="Questions">
                            <Questions />
                        </Tab>
                        <Tab eventKey="stations" title="Stations">
                            <Stations />
                        </Tab>
                        <Tab eventKey="timing" title="Timing">
                            <Timing />
                        </Tab>
                        <Tab eventKey="settings" title="Settings">
                            <Settings />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

export default App;
