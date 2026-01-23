import { describe, it, expect, beforeEach } from "vitest";
import { ConflictManager } from "./ConflictManager";

describe("ConflictManager (Mutex)", () => {
    let manager: ConflictManager;

    beforeEach(() => {
        manager = new ConflictManager();
    });

    it("should allow a train to lock a free track", () => {
        const success = manager.attemptLock("t1", "train_A");
        expect(success).toBe(true);
        expect(manager.isLocked("t1")).toBe(true);
    });

    it("should PREVENT a train from locking an occupied track", () => {
        // Train A gets there first
        manager.attemptLock("t1", "train_A");

        // Train B tries to enter
        const success = manager.attemptLock("t1", "train_B");
        
        expect(success).toBe(false); // DENIED
        
        // Verify Train A still owns it
        // (We can't inspect private map easily, but we can verify lock is still held)
        expect(manager.isLocked("t1")).toBe(true);
    });

    it("should allow the owner to release the lock", () => {
        manager.attemptLock("t1", "train_A");
        
        const released = manager.releaseLock("t1", "train_A");
        
        expect(released).toBe(true);
        expect(manager.isLocked("t1")).toBe(false);
    });

    it("should PREVENT a stranger from releasing someone else's lock", () => {
        manager.attemptLock("t1", "train_A");

        // Train B tries to sabotage Train A by releasing the lock
        const released = manager.releaseLock("t1", "train_B");

        expect(released).toBe(false); // DENIED
        expect(manager.isLocked("t1")).toBe(true); // Still locked
    });

    it("should handle releasing a lock that doesn't exist", () => {
        const result = manager.releaseLock("ghost_track", "train_A");
        expect(result).toBe(false);
    });
});