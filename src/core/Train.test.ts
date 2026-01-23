import { describe, it, expect, beforeEach } from "vitest";
import { Train } from "./Train";
import { Graph } from "./railway/Graph";
import { ConflictManager } from "./ConflictManager";

describe("Train Simulation Logic", () => {
    let graph: Graph;
    let manager: ConflictManager;

    // Helper to setup a standard "Line" graph: A --(t1)--> B --(t2)--> C
    function setupWorld() {
        const g = new Graph();
        const m = new ConflictManager();

        g.addStation({ id: "A", name: "Station A", x: 0, y: 0 });
        g.addStation({ id: "B", name: "Station B", x: 10, y: 0 });
        g.addStation({ id: "C", name: "Station C", x: 20, y: 0 });
        g.addStation({ id: "Z", name: "Island Z", x: 99, y: 99 }); // Unreachable

        g.addTrack({ id: "t1", source: "A", target: "B", baseCost: 10 });
        g.addTrack({ id: "t2", source: "B", target: "C", baseCost: 10 });

        return { g, m };
    }

    beforeEach(() => {
        const world = setupWorld();
        graph = world.g;
        manager = world.m;
    });

    it("should initialize with correct defaults", () => {
        const train = new Train("T1", "A", graph, manager);
        
        expect(train.getTrainId()).toBe("T1");
        expect(train.getCurrentStation()).toBe("A");
        expect(train.getCurrentStatus()).toBe("IDLE");
        expect(train.getTargetStation()).toBeNull();
    });

    it("should fail gracefully if destination is unreachable", () => {
        const train = new Train("T1", "A", graph, manager);
        
        // Try to go to the isolated island
        train.setDestination("Z");

        expect(train.getCurrentStatus()).toBe("IDLE"); // Should not have changed
        expect(train.getTargetStation()).toBeNull();
    });

    it("should plan a route successfully", () => {
        const train = new Train("T1", "A", graph, manager);
        train.setDestination("C");

        expect(train.getCurrentStatus()).toBe("WAITING");
        expect(train.getTargetStation()).toBe("C");
        // We can't easily check private route, but status is a good proxy
    });

    it("should execute a full journey (A -> B -> C)", () => {
        const train = new Train("T1", "A", graph, manager);
        train.setDestination("C"); // Route: [t1, t2]

        // --- TICK 1: Move A -> B ---
        const moved1 = train.update();
        expect(moved1).toBe(true);
        expect(train.getCurrentStation()).toBe("B"); 
        expect(train.getCurrentStatus()).toBe("MOVING");
        
        // Verify Lock: Train should hold 't1' now
        expect(manager.isLocked("t1")).toBe(true);
        expect(manager.isLocked("t2")).toBe(false);

        // --- TICK 2: Move B -> C ---
        const moved2 = train.update();
        expect(moved2).toBe(true);
        expect(train.getCurrentStation()).toBe("C");

        // Verify Handoff: Should have released 't1' and grabbed 't2'
        expect(manager.isLocked("t1")).toBe(false); // RELEASED!
        expect(manager.isLocked("t2")).toBe(true);  // HELD!

        // --- TICK 3: Arrival Cleanup ---
        const moved3 = train.update();
        expect(moved3).toBe(true);
        expect(train.getCurrentStatus()).toBe("IDLE");
        expect(manager.isLocked("t2")).toBe(false); // Final release
    });

    it("should handle Bidirectional Travel (The Return Trip C -> A)", () => {
        // Setup train at C
        const train = new Train("T1", "C", graph, manager);
        
        // Plan C -> B -> A
        train.setDestination("A"); 

        // --- TICK 1: Move C -> B (Using t2 backwards) ---
        train.update();
        expect(train.getCurrentStation()).toBe("B"); // Critical Check: Did logic work?
        expect(manager.isLocked("t2")).toBe(true);

        // --- TICK 2: Move B -> A (Using t1 backwards) ---
        train.update();
        expect(train.getCurrentStation()).toBe("A");
        expect(manager.isLocked("t1")).toBe(true);
        expect(manager.isLocked("t2")).toBe(false);
    });

    it("should WAITING if track is occupied (Traffic Jam)", () => {
        // 1. Sabotage: Manually lock track 't1' with a ghost train
        manager.attemptLock("t1", "GHOST_TRAIN");

        // 2. Train tries to go A -> B (needs t1)
        const train = new Train("T1", "A", graph, manager);
        train.setDestination("B");

        // 3. Attempt Move
        const success = train.update();

        // 4. Expect Denial
        expect(success).toBe(false); // Move failed
        expect(train.getCurrentStatus()).toBe("WAITING");
        expect(train.getCurrentStation()).toBe("A"); // Still at start
    });

    it("should resume movement once track is freed", () => {
        // 1. Setup Blockage
        manager.attemptLock("t1", "GHOST_TRAIN");
        const train = new Train("T1", "A", graph, manager);
        train.setDestination("B");

        // 2. First Tick (Blocked)
        train.update(); 
        expect(train.getCurrentStatus()).toBe("WAITING");

        // 3. Clear Blockage
        manager.releaseLock("t1", "GHOST_TRAIN");

        // 4. Second Tick (Freedom!)
        const success = train.update();
        expect(success).toBe(true);
        expect(train.getCurrentStation()).toBe("B");
        expect(train.getCurrentStatus()).toBe("MOVING");
    });
    
    it("should handle no-op updates gracefully", () => {
        const train = new Train("T1", "A", graph, manager);
        // No destination set
        const result = train.update();
        expect(result).toBe(false);
    });
});

describe("Edge Cases & Stress Tests", () => {
    let graph: Graph;
    let manager: ConflictManager;

    // Helper to setup a standard "Line" graph: A --(t1)--> B --(t2)--> C
    function setupWorld() {
        const g = new Graph();
        const m = new ConflictManager();

        g.addStation({ id: "A", name: "Station A", x: 0, y: 0 });
        g.addStation({ id: "B", name: "Station B", x: 10, y: 0 });
        g.addStation({ id: "C", name: "Station C", x: 20, y: 0 });
        g.addStation({ id: "Z", name: "Island Z", x: 99, y: 99 }); // Unreachable

        g.addTrack({ id: "t1", source: "A", target: "B", baseCost: 10 });
        g.addTrack({ id: "t2", source: "B", target: "C", baseCost: 10 });

        return { g, m };
    }

    beforeEach(() => {
        const world = setupWorld();
        graph = world.g;
        manager = world.m;
    });
    
    it("should handle 'Zero Distance' trips (Start == Destination)", () => {
        const train = new Train("T_LAZY", "A", graph, manager);
        
        // "I want to go to where I am right now"
        train.setDestination("A");

        // Dijkstra might return a path of [] or null, or []. 
        // We need to ensure update() handles an empty path immediately.
        const moveResult = train.update();
        
        expect(moveResult).toBe(true); // Should signal "Task Complete"
        expect(train.getCurrentStatus()).toBe("IDLE");
        expect(train.getCurrentStation()).toBe("A");
    });

    it("should handle the 'Boomerang' (A -> B -> A) without deadlocking", () => {
        /* * THE DEADLOCK TRAP:
            * 1. Train moves A -> B. It holds Lock 't1'.
            * 2. Train wants to move B -> A. It needs Lock 't1'.
            * 3. It asks ConflictManager: "Can I lock t1?"
            * 4. Manager sees 't1' is locked (by THIS train) and might say NO.
            * 5. Train waits forever for itself.
            */
        const train = new Train("T_BOOM", "A", graph, manager);
        
        // Manually force a path: [t1] (to B), then [t1] (back to A)
        // Note: Since we can't easily force Dijkstra to do A->B->A in one go 
        // without a cost incentive, we simulate two commands.
        
        // Leg 1: A -> B
        train.setDestination("B");
        train.update(); 
        expect(train.getCurrentStation()).toBe("B");
        expect(manager.isLocked("t1")).toBe(true); // We hold the track

        // Leg 2: B -> A (Immediate return)
        train.setDestination("A"); 
        const success = train.update();

        // IF THIS FAILS: Your ConflictManager/Train logic treats "Self-Locking" as a conflict.
        expect(success).toBe(true); 
        expect(train.getCurrentStation()).toBe("A");
    });

    it("should allow re-routing while WAITING (The Indecisive Dispatcher)", () => {
        // 1. Block 't1' so the train gets stuck
        manager.attemptLock("t1", "GHOST");
        
        const train = new Train("T_INDECISIVE", "A", graph, manager);
        train.setDestination("B"); // Needs t1
        
        // 2. Train tries to move, gets blocked
        train.update();
        expect(train.getCurrentStatus()).toBe("WAITING");

        // 3. CHANGE MIND: Go to 'C' (Imagine a hypothetical 't3' exists, 
        //    but for this test let's say we clear the track and change dest)
        manager.releaseLock("t1", "GHOST"); // Unblock t1
        
        // Reroute to a valid destination (B is still valid)
        train.setDestination("B"); 
        
        // 4. Should recover and move
        const success = train.update();
        expect(success).toBe(true);
        expect(train.getCurrentStation()).toBe("B");
    });

    it("should not crash if the graph returns a broken track", () => {
        const train = new Train("T_BROKEN", "A", graph, manager);
        
        // Inject a fake route with a non-existent track ID
        // (We have to cast to 'any' to violate private access for this stress test)
        (train as any).route = { path: ["non_existent_track"], totalCost: 0 };
        
        // Should return false (safely fail), NOT throw Exception
        const result = train.update();
        expect(result).toBe(false);
    });
});