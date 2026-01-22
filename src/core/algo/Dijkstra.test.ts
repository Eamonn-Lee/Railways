import { describe, it, expect, beforeEach } from "vitest";
import { Graph } from "../railway/Graph"; // Adjust path if needed
import { Dijkstra } from "./Dijkstra";

describe("Dijkstra Algorithm - Comprehensive Suite", () => {
    let graph: Graph;
    let dijkstra: Dijkstra;

    beforeEach(() => {
        graph = new Graph();
        dijkstra = new Dijkstra(graph);
    });

    // Helper to keep tests clean
    const createStation = (id: string) => ({ id, name: `Station ${id}`, x: 0, y: 0 });
    const createTrack = (id: string, src: string, trg: string, cost: number) => ({
        id, source: src, target: trg, baseCost: cost
    });

    describe("Core Pathfinding", () => {
        it("should find the simplest path between two neighbors", () => {
            // Setup
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));
            graph.addTrack(createTrack("t1", "A", "B", 10));

            // Execute
            const result = dijkstra.findPath("A", "B");

            // Verify
            expect(result).not.toBeNull();
            expect(result?.totalCost).toBe(10);
            expect(result?.path).toEqual(["t1"]);
        });

        it("should handle bi-directional travel (The 'Return Trip' Test)", () => {
            // If Graph adds track to both lists, we should be able to go B -> A
            // This verifies the 'Mirror Logic' fix in Dijkstra
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));
            graph.addTrack(createTrack("t1", "A", "B", 10));

            const result = dijkstra.findPath("B", "A");

            expect(result).not.toBeNull();
            expect(result?.totalCost).toBe(10);
            expect(result?.path).toEqual(["t1"]);
        });

        it("should choose the lower cost path in a 'Diamond' shape", () => {
            //      /-- (10) -- B -- (10) --\
            //   A                           D
            //      \-- (50) -- C -- (50) --/
            
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));
            graph.addStation(createStation("C"));
            graph.addStation(createStation("D"));

            graph.addTrack(createTrack("a-b", "A", "B", 10));
            graph.addTrack(createTrack("b-d", "B", "D", 10)); // Path 1: 20
            graph.addTrack(createTrack("a-c", "A", "C", 50));
            graph.addTrack(createTrack("c-d", "C", "D", 50)); // Path 2: 100

            const result = dijkstra.findPath("A", "D");

            expect(result?.totalCost).toBe(20);
            expect(result?.path).toEqual(["a-b", "b-d"]);
        });
    });

    describe("Railway Constraints", () => {
        it("should prioritize cheaper tracks (Resource Locking)", () => {
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));

            // Two tracks connecting A and B
            graph.addTrack(createTrack("slow", "A", "B", 100));
            graph.addTrack(createTrack("fast", "A", "B", 50));

            const result = dijkstra.findPath("A", "B");

            expect(result?.totalCost).toBe(50);
            expect(result?.path).toEqual(["fast"]);
        });
    });

    describe("Edge Cases", () => {
        it("should return null for unreachable destinations", () => {
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));
            graph.addStation(createStation("Island"));
            
            graph.addTrack(createTrack("t1", "A", "B", 10));

            const result = dijkstra.findPath("A", "Island");
            expect(result).toBeNull();
        });

        it("should navigate complex cycles correctly", () => {
            // A -> B -> C -> A (Loop)
            // But C also connects to D (Exit)
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));
            graph.addStation(createStation("C"));
            graph.addStation(createStation("D"));

            graph.addTrack(createTrack("t1", "A", "B", 10));
            graph.addTrack(createTrack("t2", "B", "C", 10));
            graph.addTrack(createTrack("t3", "C", "A", 10)); // Loop back
            graph.addTrack(createTrack("t4", "C", "D", 10)); // Escape

            const result = dijkstra.findPath("A", "D"); //A->C(via t3 ca)->D

            expect(result?.totalCost).toBe(20);
            expect(result?.path).toEqual(["t3", "t4"]);
        });

        it("should navigate a Cycle correctly (avoiding expensive shortcuts)", () => {
            // Topology:
            // A --(10)--> B --(10)--> C --(10)--> D (Exit)
            // |                       ^
            // \--------(100)----------/ 
            //
            // There is a direct link A<->C, but it costs 100.
            // The algorithm must be smart enough to go A->B->C (Cost 20) instead of A->C (Cost 100).
            
            graph.addStation(createStation("A"));
            graph.addStation(createStation("B"));
            graph.addStation(createStation("C"));
            graph.addStation(createStation("D"));

            graph.addTrack(createTrack("t1", "A", "B", 10));  // The long way start
            graph.addTrack(createTrack("t2", "B", "C", 10));  // The long way middle
            graph.addTrack(createTrack("t3_bad", "A", "C", 100)); // The expensive shortcut
            graph.addTrack(createTrack("t4", "C", "D", 10));  // The exit

            const result = dijkstra.findPath("A", "D");

            // Expectation: 
            // A -> B (10) -> C (10) -> D (10) = 30
            // NOT: A -> C (100) -> D (10) = 110
            
            expect(result?.totalCost).toBe(30);
            expect(result?.path).toEqual(["t1", "t2", "t4"]); 
        });
    });
});