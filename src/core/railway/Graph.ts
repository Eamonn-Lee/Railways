//No imports

export interface Station {
    id: string;
    name: string;
    x: number;
    y: number;

}

export interface Track {
    id: string;
    source: string;
    target: string;
    baseCost: number;
}

export class Graph {
    private stations: Map<string, Station>;         //st_id * item
    private adjacencylist: Map<string, Track[]>;    //st_id * list of tracks

    constructor() {
        this.stations = new Map();
        this.adjacencylist = new Map();
    }

    public addStation(station: Station): boolean {
        if (this.stations.has(station.id)) {return false;}    //fail, stations already exists

        this.stations.set(station.id, station); //initialisation via [] would be plain object, not a optimal map. must use map methods
        this.adjacencylist.set(station.id, []); //empty list
        return true;
    }
    public addTrack(track: Track): boolean {
        const statS = track.source; //does this optimise because we don't need to continuously reaccess inside track?
        const statD = track.target;

        if (!this.stations.has(statS) || !this.stations.has(statD)) {return false;}   //missing one of the stations
        const adjSour = this.adjacencylist.get(statS)!;     //! at end: non null assertion. Tells compiler that these do exist
        const adjTarg = this.adjacencylist.get(statD)!;
        // ? = if thing does not exist, make it a undefined -> prevent crash
        // ?? = default value (const x = undefined ?? "Unknown thing")
        //  ... = clones shit (const movedStation = { ...station, x: 50 };)

        //DO NOT USE [].INCLUDES: [].includes checks the pointer memory, not equality of object
        if (adjSour.some(t => (t.id === track.id)) || adjTarg.some(t => (t.id === track.id))) {return false;} //tracks already exist in one

        //Track does not exist, new track
        adjSour.push(track);
        adjTarg.push(track);

        return true;
    }

    public getNeighbours(id: string): Track[] {
        /* //ERROR HANDLING EXAMPLE
        if (!this.adjacencylist.has(id)){
            throw new Error(`Station with ID "${id}" not found.`)
        };
        return this.adjacencylist.get(id)!;
        */

        return this.adjacencylist.get(id) ?? [];    //example of ??
    }
}

