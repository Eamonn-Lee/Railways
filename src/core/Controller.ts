import { Graph } from "./railway/Graph";
import { ConflictManager } from "./ConflictManager";
import { Train } from "./Train";

export interface TrainData {    //snapshot into life of a train
    id: string;
    location: string;
    destination: string | null;
    currentTrack: string | null;
    status: string;
}

export class Controller {
    private trains: Map<string, Train>;
    private readonly conflictManager: ConflictManager;
    private readonly graph: Graph;

    constructor(graph: Graph) { //use item specific constructors to initialise stuff
        this.trains = new Map();
        this.conflictManager = new ConflictManager;
        this.graph = graph;
    }

    public createTrain(trainId: string, start: string): boolean {
        if (this.trains.has(trainId)) {
            console.warn(`Cannot create pre-existing train ${trainId}`);
            return false;
        }

        this.trains.set(trainId, new Train(trainId, start, this.graph, this.conflictManager));
        return true;
    }

    public setTrainDest(trainId: string, trainDest: string): boolean {
        return this.trains.get(trainId)?.setDestination(trainDest) ?? false;
    }

    public update() {
        this.trains.forEach(t => t.update());
    }

    public getSnapshot(): TrainData[] {
        return Array.from(this.trains.values()).map(t => ({
            id: t.getTrainId(),
            location: t.getCurrentStation(),
            destination: t.getTargetStation(),
            currentTrack: t.getCurrentTrack(),
            status: t.getCurrentStatus(),
        }))
    }

}