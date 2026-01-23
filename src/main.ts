import { Graph } from "./core/railway/Graph";
import { Controller } from "./core/Controller";

console.log("GRAPH: INIT");
const graph = new Graph();

// Stations
graph.addStation({ id: "ST_01", name: "Sector 1", x: 0, y: 0 });
graph.addStation({ id: "ST_02", name: "Sector 2", x: 10, y: 0 });
graph.addStation({ id: "ST_03", name: "Sector 3", x: 20, y: 0 });
graph.addStation({ id: "ST_04", name: "Sector 4", x: 10, y: 10 });

// Edges
// ST_01 <-> ST_02 (Cost 10)
graph.addTrack({ id: "TRK_101", source: "ST_01", target: "ST_02", baseCost: 10 });
// ST_02 <-> ST_03 (Cost 15)
graph.addTrack({ id: "TRK_102", source: "ST_02", target: "ST_03", baseCost: 15 });
// ST_02 <-> ST_04 (Cost 20)
graph.addTrack({ id: "TRK_103", source: "ST_02", target: "ST_04", baseCost: 20 });

console.log("GRAPH: FIN");

console.log("CONTROLLER INIT")
const system = new Controller(graph);


console.log("TRAINS INIT");

// Unit 1: ST_01 -> ST_03
if (system.createTrain("TR_001", "ST_01")) {
    system.setTrainDest("TR_001", "ST_03");
}

// Unit 2: ST_03 -> ST_01
if (system.createTrain("TR_002", "ST_03")) {
    system.setTrainDest("TR_002", "ST_01");
}

// Unit 3: ST_04 -> ST_02
if (system.createTrain("TR_003", "ST_04")) {
    system.setTrainDest("TR_003", "ST_02");
}

console.log("READY: Ctrl + C to terminate");
setTimeout(()=>{}, 1000);

let tickCount = 0;
setInterval(() => {
    tickCount++;
    
    system.update();

    const snapshot = system.getSnapshot();
    
    console.clear(); 
    console.log(`\n=== TICK ${tickCount} ===`);
    console.table(snapshot); 

}, 1000);