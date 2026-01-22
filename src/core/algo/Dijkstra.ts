//imports
import { MinHeap } from "../ds/MinHeap";
import { Graph, type Track } from "../railway/Graph";

export interface PathResult {
    path: string[];
    totalCost:number;
}

//      (Name)   (Type)      (Value)
//         ↓       ↓            ↓
//    let path: string[]   =   [];

export class Dijkstra {
    private explore: Graph;

    constructor(explore: Graph) {
        this.explore = explore;
    }

    public findPath(start: string, end:string): PathResult | null {
        const distances = new Map<string, number>();    //const is mutable, just not reassignable
        const previous = new Map<string, {prevStation: string, viaTrack: string}>();    //we can have multiple edges(diff weights) between nodes

        const visited = new Set<string>();  //visited optimisation

        const pq = new MinHeap<string>();

        //begin algo
        distances.set(start, 0);    //distance from node to itself is 0
        pq.push(start, 0);

        while (!pq.isEmpty()) {
            //get neighbours

            /*Dijkstra's guarantee -> because we're priority queue based on source dist to node, 
                we will ALWAYS fully examine a node via it's shortest path 
                we queue on long paths to the node, but when we find a possible shorter path, we add it to the pq
                that will always bubble up and we record the future neighbours based on that shortest one
            */
            // Const is refreshed on new loop
            const node = pq.pop()!;   //we are assuring pop will never be empty(because we while loop check)

            if (node === end) { break; }    //early exit optimisation
            if (visited.has(node)) { continue; }  //dijksta pop guarantee
            visited.add(node);

            //Explicit typing to use the variable. guarantee that it must be a track, so any breakages are ok
            const pathsOut: Track[] = this.explore.getNeighbours(node);
            const nodeDist = distances.get(node)!;   //one call to fastest distance to current node. edge case with negative weighted edge to itself? should always resolve because using parent

            for (const path of pathsOut) {
                const destination = (path.source === node) ? path.target : path.source;   //just looking at path out. tracks are stored 1 way, but are bidirectional.
                if (visited.has(destination)) { continue; }   //if we've already looked at getting to this neighbour node, we don't care

                const distViaNode = path.baseCost + nodeDist;

                if (distViaNode < (distances.get(destination) ?? Infinity)) { //dist via parent node is better
                    distances.set(destination, distViaNode);
                    
                    previous.set(destination, { 
                        prevStation: node,
                        viaTrack: path.id 
                        });

                    pq.push(destination, distViaNode);  //push ONLY if better way found
                }
                
            }
        }
        //Finish explore, now construct path
        if (!distances.has(end)) {
            return null;
        } else {
            const path: string[] = [];
            let backtrack = end;
            while (backtrack != start) {
                const prev = previous.get(backtrack)!;   //possible undefined
                path.push(prev.viaTrack);
                backtrack = prev.prevStation;
            }
            path.reverse();

            return {path, totalCost: distances.get(end)!}
        }
    }
}