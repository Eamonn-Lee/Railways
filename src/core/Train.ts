import { Graph } from "./railway/Graph";
import { ConflictManager } from "./ConflictManager";
import { Dijkstra, type PathResult } from "./algo/Dijkstra";

type TrainStatus = "MOVING" | "IDLE" | "WAITING";

export class Train {
    private id: string;
    private target: string | null; //stationid
    private current: string; //stationid
    private status: TrainStatus; 

    private heldTrack: string | null;

    private readonly conflictCopy: ConflictManager; //readonly is essentially const for class properties
    private graph: Graph;   //not sure if needed for use inside?
    private navigator: Dijkstra;
    private route: PathResult | null;

    constructor(trainId: string, start: string, graph: Graph, conflictManager : ConflictManager) {
        this.id = trainId;
        this.current = start;
        this.target = null;
        this.status = "IDLE";
        this.conflictCopy = conflictManager;
        this.graph = graph;
        this.navigator = new Dijkstra(graph);
        this.route = null;
        this.heldTrack = null;
    }

    public getTrainId() : string { return this.id; }
    public getCurrentStation() : string { return this.current; }
    public getCurrentStatus(): TrainStatus { return this.status; }
    public getTargetStation(): string | null { return this.target; }
    public getCurrentTrack(): string | null { return this.heldTrack; }

    public setDestination(destStation: string): boolean {
        const plan = this.navigator.findPath(this.current, destStation);
        if (plan === null) {
            console.warn(`[Train ${this.getTrainId()}] Failed find path ${this.getCurrentStation()}->${destStation}`);
            return false;
        } else {
            this.target = destStation
            this.route = plan;
            this.status = "WAITING";
            console.log(`[Train ${this.getTrainId()}] Ready ${this.getCurrentStation()}->${this.getTargetStation()} @ ${plan.totalCost}: \n       ${plan.path}`);
            return true;
        }
    }

    public update() : boolean { //attempt to move train 1 path, return successful move
        if (this.route === null) {
            console.warn(`[Train ${this.getTrainId()}] No destination set`);
            return false;
        }
        const remaining = this.route.path;
        
        if (remaining.length === 0) {
            this.status = "IDLE";
            // train current should already be at destination
            this.target = null;
            this.route = null;
            if (this.heldTrack !== null) {  //reset heldtrack if needed
                this.conflictCopy.releaseLock(this.heldTrack, this.id);
                this.heldTrack = null;
            }
            console.log(`[Train ${this.getTrainId()}] IDLE @ ${this.getCurrentStation()}: FIN`);
            return true;
        }
        const next = remaining.at(0)!;

        if (this.conflictCopy.attemptLock(next, this.id) ) {
            // get info of new track
            const release = this.graph.getTrack(next);
            if (release === null) { //  unable to get track?
                console.warn(`[Train ${this.getTrainId()}] ERROR: ${next} track does not exist?`)
                return false;
            }

            // Move train to next station
            this.current = (release.source === this.current) ? release.target : release.source; //calculate correct bidirectionality
            remaining.shift();  //rmv track currently on
            this.status = "MOVING";
            
            // Unlock path
            this.conflictCopy.releaseLock(next, this.id);
            this.heldTrack = null;

            console.log(`[Train ${this.getTrainId()}] MOVE to ${this.current}`);
            return true;
        } else {
            this.status = "WAITING";
            console.log(`[Train ${this.getTrainId()}] WAIT @ ${this.getCurrentTrack()}: REQ ${next}`);
            return false;
        }
    }

}