import { describe, it, expect, beforeEach } from 'vitest';
import { MinHeap } from './MinHeap';

describe('MinHeap Data Structure', () => {
  let heap: MinHeap<string>;

  beforeEach(() => {
    heap = new MinHeap<string>();
  });

  // ----------------------------------------------------------------
  // 1. BASIC OPERATIONS
  // ----------------------------------------------------------------
  describe('Basic Operations', () => {
    it('should start empty', () => {
      expect(heap.isEmpty()).toBe(true);
      expect(heap.size()).toBe(0);
    });

    it('should allow peeking at the top element without removing it', () => {
      heap.push('A', 10);
      expect(heap.peek()).toBe('A');
      expect(heap.size()).toBe(1);
    });

    it('should return undefined when popping an empty heap', () => {
      expect(heap.pop()).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // 2. PRIORITY LOGIC (The Core Algo)
  // ----------------------------------------------------------------
  describe('Priority Logic (BubbleUp & SinkDown)', () => {
    it('should maintain min-heap property on insertion (BubbleUp)', () => {
      // Add items in REVERSE order (worst case)
      heap.push('Worst', 100);
      heap.push('Bad', 50);
      heap.push('Good', 10);
      heap.push('Best', 1);

      // The smallest should Bubble Up to the top immediately
      expect(heap.peek()).toBe('Best');
    });

    it('should extract elements in ascending priority order (SinkDown)', () => {
      // Add random chaos
      heap.push('Mid', 50);
      heap.push('Low', 10);
      heap.push('High', 100);
      heap.push('Lowest', 1);

      // Verify extraction order
      expect(heap.pop()).toBe('Lowest'); // Priority 1
      expect(heap.pop()).toBe('Low');    // Priority 10
      expect(heap.pop()).toBe('Mid');    // Priority 50
      expect(heap.pop()).toBe('High');   // Priority 100
    });

    it('should handle elements with identical priority', () => {
      // FIFO order is NOT guaranteed in standard Heaps, 
      // but they must both come out before higher numbers.
      heap.push('A1', 10);
      heap.push('B2', 20);
      heap.push('A2', 10); // Same priority as A1

      const first = heap.pop();
      const second = heap.pop();
      const third = heap.pop();

      // Both A1 and A2 (priority 10) must come before B2 (priority 20)
      expect([first, second]).toContain('A1');
      expect([first, second]).toContain('A2');
      expect(third).toBe('B2');
    });
  });

  // ----------------------------------------------------------------
  // 3. COMPLEX SCENARIOS
  // ----------------------------------------------------------------
  describe('Complex Scenarios', () => {
    it('should handle "Interleaved" push and pop operations', () => {
      // This simulates real pathfinding: we add neighbors, visit one, add more...
      heap.push('A', 10);
      heap.push('B', 20);
      
      expect(heap.pop()).toBe('A'); // Remove 10. Heap has [20]
      
      heap.push('C', 5); // Add 5. Heap has [5, 20] (5 bubbles up)
      heap.push('D', 15); // Add 15. Heap has [5, 20, 15] -> [5, 15, 20]
      
      expect(heap.pop()).toBe('C'); // 5
      expect(heap.pop()).toBe('D'); // 15
      expect(heap.pop()).toBe('B'); // 20
    });

    it('should handle a large number of items and return them in correct order', () => {
      const count = 1000;
      const priorities: number[] = [];

      // 1. Generate random priorities
      for (let i = 0; i < count; i++) {
        const p = Math.floor(Math.random() * 10000);
        priorities.push(p);
        
        // Trick: Store the priority as the string value too
        // So when we pop "500", we know its priority was 500.
        heap.push(p.toString(), p); 
      }

      // 2. Sort our list (JavaScript's default sort is alphabetical, so we need a function!)
      priorities.sort((a, b) => a - b);

      // 3. Verify
      for (let i = 0; i < count; i++) {
        const poppedVal = heap.pop();
        const expectedPriority = priorities[i];

        // The value we popped should be the string version of the priority
        // NOTE: This assumes we don't have duplicate priorities, 
        // or if we do, the order doesn't matter because "10" equals "10".
        expect(poppedVal).toBe(expectedPriority.toString());
      }
    });
  });
});