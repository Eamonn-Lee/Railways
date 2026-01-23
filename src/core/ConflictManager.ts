//A cursed mutex based on map. single usage of tracks
export interface Lock {
    trainId : string;
    timestamp: number
}

export class ConflictManager {
    private locks: Map<string, Lock>;

    constructor() {
        this.locks = new Map<string, Lock>();
    }

    public isLocked(trackId: string): boolean {
        return this.locks.has(trackId);
    }

    public attemptLock(trackId:string, trainId:string): boolean {
        if (this.locks.get(trackId)?.trainId === trainId) { return true };  //if no track id, resolves to undefined, then stops further operation. normal logic flow

        if (!this.locks.has(trackId)) { //if no lock held
            this.locks.set(trackId, {trainId, timestamp: new Date().valueOf()})
            return true;
        }
        return false;
    }

    public releaseLock(trackId:string, trainId:string): boolean {
        if (this.locks.has(trackId) && (this.locks.get(trackId)!.trainId === trainId)) {
            return this.locks.delete(trackId);
        }

        return false; //generally something weird happened? but won't alter lock
    }
}