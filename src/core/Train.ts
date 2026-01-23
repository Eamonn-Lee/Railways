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
            //train now has lock
            const tempLock = this.heldTrack;
            this.heldTrack = next;

            //=======STATECHANGE======


            if (tempLock !== null) { //need to release lock
                this.conflictCopy.releaseLock(tempLock, this.id);
                //check recovery if needed, early end before we alter state
            }

            //const release = ; 
            //CONDUCT CHECK TO ENSURE THIS TRACK EXISTED?

            const release = this.graph.getTrack(remaining[0]);
            if (release === null) {
                //track doesn't exist???
                return false;
            }
            this.current = (release.source === this.current) ? release.target : release.source; //calculating correct bidirectionality
            remaining.shift();  //pop off track we're now on
            this.status = "MOVING"; //update status
            console.log(`[Train ${this.getTrainId()}] MOVE from ${release.id}: ON ${this.getCurrentTrack()}`);
            //===============================
            return true;

        } else {
            this.status = "WAITING";
            console.log(`[Train ${this.getTrainId()}] WAIT @ ${this.getCurrentTrack()}: REQ ${next}`);
            return false;
        }
    }

}