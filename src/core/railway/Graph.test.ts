import { describe, it, expect, beforeEach } from 'vitest';
import { Graph, Station, Track } from './Graph';

// ------------------------------------------------------------------
// TEST DATA GENERATORS
// Helpers to keep our tests clean and readable
// ------------------------------------------------------------------
const makeStation = (id: string): Station => ({ 
    id, name: `Station ${id}`, x: 0, y: 0 
});

const makeTrack = (id: string, s: string, t: string): Track => ({ 
    id, source: s, target: t, baseCost: 10 
});

describe('Graph System', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  // ----------------------------------------------------------------
  // 1. STATION MANAGEMENT
  // ----------------------------------------------------------------
  describe('Station Operations', () => {
    it('should successfully register a new station', () => {
      const result = graph.addStation(makeStation('A'));
      expect(result).toBe(true);
    });

    it('should reject duplicate station IDs', () => {
      graph.addStation(makeStation('A'));
      
      // Attempt to add 'A' again
      const result = graph.addStation(makeStation('A'));
      expect(result).toBe(false);
    });

    it('should initialize stations with 0 neighbors', () => {
      graph.addStation(makeStation('A'));
      expect(graph.getNeighbours('A')).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // 2. TRACK MANAGEMENT (The "Happy Path")
  // ----------------------------------------------------------------
  describe('Track Operations (Connectivity)', () => {
    beforeEach(() => {
      // Setup a basic world for these tests
      graph.addStation(makeStation('London'));
      graph.addStation(makeStation('Paris'));
    });

    it('should connect two existing stations', () => {
      const track = makeTrack('t1', 'London', 'Paris');
      const result = graph.addTrack(track);
      
      expect(result).toBe(true);
    });

    it('should establish bi-directional adjacency', () => {
      // If I add London -> Paris, Paris should also know about London
      const track = makeTrack('t1', 'London', 'Paris');
      graph.addTrack(track);

      const londonNeighbors = graph.getNeighbours('London');
      const parisNeighbors = graph.getNeighbours('Paris');

      // Both stations should list this track
      expect(londonNeighbors).toHaveLength(1);
      expect(londonNeighbors[0].id).toBe('t1');

      expect(parisNeighbors).toHaveLength(1);
      expect(parisNeighbors[0].id).toBe('t1');
    });
  });

  // ----------------------------------------------------------------
  // 3. ROBUSTNESS & ERROR HANDLING (The "Unhappy Path")
  // ----------------------------------------------------------------
  describe('Robustness Checks', () => {
    beforeEach(() => {
      graph.addStation(makeStation('A'));
      graph.addStation(makeStation('B'));
    });

    it('should prevent connecting to a non-existent station (Source)', () => {
      const track = makeTrack('t1', 'MissingStation', 'B');
      expect(graph.addTrack(track)).toBe(false);
    });

    it('should prevent connecting to a non-existent station (Target)', () => {
      const track = makeTrack('t1', 'A', 'MissingStation');
      expect(graph.addTrack(track)).toBe(false);
    });

    it('should prevent duplicate tracks (Same Object)', () => {
      const track = makeTrack('t1', 'A', 'B');
      graph.addTrack(track);
      
      // Add exact same object again
      expect(graph.addTrack(track)).toBe(false);
      // Ensure neighbors count didn't increase
      expect(graph.getNeighbours('A')).toHaveLength(1);
    });

    it('should prevent duplicate tracks (Same ID, Different Object)', () => {
      graph.addTrack(makeTrack('t1', 'A', 'B'));
      
      // New object, but same ID 't1'
      const duplicateTrack = makeTrack('t1', 'A', 'B');
      expect(graph.addTrack(duplicateTrack)).toBe(false);
    });

    it('should return empty array for unknown station queries', () => {
      // Critical for preventing crashes in UI
      expect(graph.getNeighbours('GhostTown')).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // 4. COMPLEX TOPOLOGY
  // ----------------------------------------------------------------
  describe('Topology & Graph Shape', () => {
    it('should handle a chain of stations (A - B - C)', () => {
      // A connects to B. B connects to C.
      // A has 1 neighbor. B has 2. C has 1.
      graph.addStation(makeStation('A'));
      graph.addStation(makeStation('B'));
      graph.addStation(makeStation('C'));

      graph.addTrack(makeTrack('t1', 'A', 'B'));
      graph.addTrack(makeTrack('t2', 'B', 'C'));

      expect(graph.getNeighbours('A')).toHaveLength(1);
      expect(graph.getNeighbours('C')).toHaveLength(1);
      
      const bNeighbors = graph.getNeighbours('B');
      expect(bNeighbors).toHaveLength(2);
      
      // Verify B is connected to t1 AND t2
      const trackIds = bNeighbors.map(t => t.id).sort();
      expect(trackIds).toEqual(['t1', 't2']);
    });

    it('should handle disconnected islands', () => {
      // Island 1: A-B
      // Island 2: C-D
      graph.addStation(makeStation('A'));
      graph.addStation(makeStation('B'));
      graph.addStation(makeStation('C'));
      graph.addStation(makeStation('D'));

      graph.addTrack(makeTrack('t1', 'A', 'B'));
      graph.addTrack(makeTrack('t2', 'C', 'D'));

      // A should NOT be able to reach C
      const neighborsA = graph.getNeighbours('A');
      // We can verify this implicitly: A only knows about t1
      expect(neighborsA[0].id).toBe('t1');
    });
  });
});