/**
 * Created by tougo on 14/3/16.
 */

function ReadData(addGeoObject, group) {
    "use strict";
    $.get("data.json")
        .done(function (data) {
            var obj = {};
            obj.paths = [];
            obj.amounts = [];
            obj.colors = [];
            obj.offsets = [];
            data.forEach(function (building) {
                var CurrentFloor = 0;
                building.floors.forEach(function(floor) {
                    obj.paths.push("M" + floor.footprint.join(" L") + " Z");
                    obj.amounts.push(floor.height);
                    obj.offsets.push(CurrentFloor);
                    CurrentFloor += floor.height;
                    obj.colors.push(Math.random() * 0xffffff);
                });
                if (building.roof) {
                    //TODO check if there are always 2 points
                    createRoof(building.rooftop, building.floors[building.floors.length - 1], CurrentFloor, building.roofheight, group);
                }
                createDoors(building.doors, group);
            });
            //obj.center = {x: 20, y: 20};
            addGeoObject(group, obj);
        });
}

function createDoors(doors, group) {

    doors.forEach(function (door) {
        var geometry = new THREE.CylinderGeometry(2, 2, door.height, 10);
        createMesh(geometry, group, door.position[0], geometry.parameters.height / 2, -door.position[1], Math.PI / 2);
    });
}

function createRoof(rooftop, topfloor, maxheight, roofheight, group) {
    "use strict";
    var buildingHeight = maxheight + roofheight;
    var NearestA = [];
    var NearestB = [];

    topfloor.footprint.forEach(function (pair) {
        NearestA.push(distance(rooftop[0], pair));
        NearestB.push(distance(rooftop[1], pair));
    });

    var MinIndecesA = findMinimumValueIndices(NearestA);
    var MinIndecesB = findMinimumValueIndices(NearestB);

    var geometry = new THREE.Geometry();
    //Triangular sides
    geometry.vertices.push(
        new THREE.Vector3(rooftop[0][0], rooftop[0][1], buildingHeight),
        new THREE.Vector3(topfloor.footprint[MinIndecesA[0]][0], topfloor.footprint[MinIndecesA[0]][1], maxheight),
        new THREE.Vector3(topfloor.footprint[MinIndecesA[1]][0], topfloor.footprint[MinIndecesA[1]][1], maxheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], buildingHeight),
        new THREE.Vector3(topfloor.footprint[MinIndecesB[0]][0], topfloor.footprint[MinIndecesB[0]][1], maxheight),
        new THREE.Vector3(topfloor.footprint[MinIndecesB[1]][0], topfloor.footprint[MinIndecesB[1]][1], maxheight)
    );

    var MaxMinA = MinIndecesA.max();
    var MaxMinB = MinIndecesB.max();
    var NextMaxB = MaxMinB + 1;
    if (NextMaxB > 3) {
        NextMaxB = 1;
    }

    //half roof
    geometry = createRoofSlope(geometry, rooftop, buildingHeight, topfloor, MaxMinA, MaxMinB, NextMaxB, maxheight);

    MaxMinA = MinIndecesA.min();
    MaxMinB = MinIndecesB.min();
    NextMaxB = MaxMinB - 1;
    if (NextMaxB < 0) {
        NextMaxB = 1;
    }

    //half roof
    geometry = createRoofSlope(geometry, rooftop, buildingHeight, topfloor, MaxMinA, MaxMinB, NextMaxB, maxheight);

    var color = new THREE.Color(Math.random() * 0xffffff);

    geometry.vertices.forEach(function (vertex, index) {
        var currentFaceIndex = index * 3;
        geometry.faces.push(new THREE.Face3(currentFaceIndex, currentFaceIndex + 1, currentFaceIndex + 2, color));
    });

    return createMesh(geometry, group);
}

function createRoofSlope(geometry, rooftop, buildingHeight, topfloor, MaxMinA, MaxMinB, NextMaxB, maxheight) {
    "use strict";
    geometry.vertices.push(
        new THREE.Vector3(rooftop[0][0], rooftop[0][1], buildingHeight),
        new THREE.Vector3(topfloor.footprint[MaxMinA][0], topfloor.footprint[MaxMinA][1], maxheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], buildingHeight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], buildingHeight),
        new THREE.Vector3(topfloor.footprint[MaxMinB][0], topfloor.footprint[MaxMinB][1], maxheight),
        new THREE.Vector3(topfloor.footprint[NextMaxB][0], topfloor.footprint[NextMaxB][1], maxheight)
    );

    return geometry;
}

function createMesh(geometry, group, translateX, translateY, translateZ, rotate) {
    "use strict";
    if(translateX === undefined){
        translateX = 0;
    }
    if(translateY === undefined){
        translateY = 0;
    }
    if(translateZ === undefined){
        translateZ = 0;
    }
    if(rotate === undefined){
        rotate = 0;
    }
    var color = new THREE.Color(Math.random() * 0xffffff);
    var materials = [
        new THREE.MeshPhongMaterial({
            color: color,
            shading: THREE.FlatShading,
            vertexColors: THREE.VertexColors,
            shininess: 0,
            side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true})
    ];

    var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, materials);
    //TODO got to get rid of translations, not really needed they are just stuck from the examples
    mesh.rotation.x = rotate;
    mesh.translateX(translateX);
    mesh.translateY(translateY);
    mesh.translateZ(translateZ);
    group.add(mesh);
}

function distance(PointA, PointB) {
    "use strict";
    return Math.sqrt(Math.pow(PointB[0] - PointA[0], 2) + Math.pow(PointB[1] - PointA[1], 2));
}

function findMinimumValueIndices(array) {
    "use strict";
    var MiniumValues = [];
    array.forEach(function (item, index) {
        if (MiniumValues.length === 0) {
            MiniumValues.push(index);
        } else if (MiniumValues.length === 1) {
            MiniumValues.push(index);
        }
        var isBigger = true;
        if (index > 1) {
            if (item < array[MiniumValues[0]]) {
                MiniumValues[0] = index;
                isBigger = false;
            }
            if (item < array[MiniumValues[1]] && isBigger) {
                MiniumValues[1] = index;
            }
        }
    });
    return MiniumValues;
}

Array.prototype.max = function () {
    "use strict";
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    "use strict";
    return Math.min.apply(null, this);
};