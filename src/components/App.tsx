// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Col, Container, Row, Tab, Tabs } from "react-bootstrap";
import GameMap from "./GameMap";
import Questions from "./Questions";
import Settings from "./Settings";
import Stations from "./Stations";
import ToastManager from "./ToastManager";

function App() {
    return (
        <>
            <ToastManager />
            <Container fluid>
                <Row className="my-1 gy-1">
                    <Col lg={8}>
                        <GameMap />
                    </Col>
                    <Col lg={4} className="tabs">
                        <Tabs defaultActiveKey="questions">
                            <Tab eventKey="questions" title="Questions">
                                <Questions />
                            </Tab>
                            <Tab eventKey="stations" title="Stations">
                                <Stations />
                            </Tab>
                            <Tab eventKey="settings" title="Settings">
                                <Settings />
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default App;
