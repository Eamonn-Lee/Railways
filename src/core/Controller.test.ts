import { describe, it, expect, beforeEach } from "vitest";
import { Controller } from "./Controller";
import { Graph } from "./railway/Graph";

describe("Railway Controller Integration Tests", () => {
    let graph: Graph;
    let controller: Controller;

    // Setup: A Line Graph (A <-> B <-> C) and an Isolated Station (Z)
    beforeEach(() => {
        graph = new Graph();
        
        // Stations
        graph.addStation({ id: "A", name: "Alpha", x: 0, y: 0 });
        graph.addStation({ id: "B", name: "Bravo", x: 10, y: 0 });
        graph.addStation({ id: "C", name: "Charlie", x: 20, y: 0 });
        graph.addStation({ id: "Z", name: "Zulu", x: 100, y: 100 }); // Isolated

        // Tracks (Bidirectional logic handled by Graph/Train, but we define A->B, B->C)
        graph.addTrack({ id: "t1", source: "A", target: "B", baseCost: 10 });
        graph.addTrack({ id: "t2", source: "B", target: "C", baseCost: 10 });

        controller = new Controller(graph);
    });

    describe("1. Train Management (CRUD)", () => {
        it("should successfully spawn a train at a valid station", () => {
            const success = controller.createTrain("T1", "A");
            
            expect(success).toBe(true);
            const snapshot = controller.getSnapshot();
            expect(snapshot).toHaveLength(1);
            expect(snapshot[0]).toEqual(expect.objectContaining({
                id: "T1",
                location: "A",
                status: "IDLE"
            }));
        });

        it("should reject spawning a train with a duplicate ID", () => {
            controller.createTrain("T1", "A");
            const retry = controller.createTrain("T1", "B"); // Same ID
            
            expect(retry).toBe(false); // Should fail
            expect(controller.getSnapshot()).toHaveLength(1); // Count remains 1
        });
        
        // Note: Assuming your Train/Graph doesn't throw on invalid start station 
        // but just accepts the string, we check the snapshot matches the input.
        it("should create train even if station doesn't exist (unless Train validation prevents it)", () => {
            const success = controller.createTrain("T_VOID", "VOID_STATION");
            expect(success).toBe(true);
            expect(controller.getSnapshot()[0].location).toBe("VOID_STATION");
        });
    });

    describe("2. Commanding Trains", () => {
        beforeEach(() => {
            controller.createTrain("T1", "A");
        });

        it("should successfully set a valid destination (A -> C)", () => {
            const result = controller.setTrainDest("T1", "C");
            
            expect(result).toBe(true);
            
            const train = controller.getSnapshot()[0];
            expect(train.destination).toBe("C");
            expect(train.status).toBe("WAITING"); // Status changes immediately after planning
        });

        it("should return FALSE when ordering a non-existent train", () => {
            const result = controller.setTrainDest("GHOST", "B");
            expect(result).toBe(false);
        });

        it("should return FALSE if pathfinding fails (A -> Z)", () => {
            // Z is an island. No path exists.
            const result = controller.setTrainDest("T1", "Z");
            
            expect(result).toBe(false); // Controller should bubble up the failure
            
            const train = controller.getSnapshot()[0];
            expect(train.destination).toBeNull(); // Should not have updated target
            expect(train.status).toBe("IDLE");
        });
    });

    describe("3. Simulation Loop (Tick Updates)", () => {
        it("should advance simulation state when update() is called", () => {
            controller.createTrain("T1", "A");
            controller.setTrainDest("T1", "B"); // Needs track 't1'

            // Initial State
            expect(controller.getSnapshot()[0].status).toBe("WAITING");

            // Tick 1: Train grabs lock and moves to 't1'
            controller.update();
            
            let snap = controller.getSnapshot()[0];
            expect(snap.status).toBe("MOVING");
            expect(snap.currentTrack).toBe("t1"); // Verify track occupation

            // Tick 2: Train arrives at B
            controller.update();
            
            snap = controller.getSnapshot()[0];
            expect(snap.location).toBe("B");
            // Depending on your logic, it might be IDLE or finishing move
            // If route was just [t1], it is now empty.
        });

        it("should handle multiple trains updating simultaneously", () => {
            controller.createTrain("T1", "A");
            controller.createTrain("T2", "B");

            controller.setTrainDest("T1", "B"); // T1: A->B
            controller.setTrainDest("T2", "C"); // T2: B->C

            controller.update(); // Both should move

            const snap = controller.getSnapshot();
            const t1 = snap.find(t => t.id === "T1");
            const t2 = snap.find(t => t.id === "T2");

            expect(t1?.status).toBe("MOVING");
            expect(t2?.status).toBe("MOVING");
        });
    });

    describe("4. Data Integrity (Snapshot)", () => {
        it("should return null for fields when train is IDLE", () => {
            controller.createTrain("T1", "A");
            const snap = controller.getSnapshot()[0];

            expect(snap.destination).toBeNull();
            expect(snap.currentTrack).toBeNull();
            expect(snap.status).toBe("IDLE");
        });

        it("should map internal state correctly to public snapshot", () => {
            controller.createTrain("T1", "A");
            controller.setTrainDest("T1", "B");
            
            // Force an update to get onto the track
            controller.update();

            const snap = controller.getSnapshot()[0];

            // Verify the Shape matches the Interface exactly
            expect(snap).toStrictEqual({
                id: "T1",
                location: "B", // Physically still at source until move completes
                destination: "B",
                currentTrack: "t1",
                status: "MOVING"
            });
        });
    });
});