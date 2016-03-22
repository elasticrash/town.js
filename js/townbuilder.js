/**
 * Created by tougo on 14/3/16.
 */

function ReadData(addGeoObject, group) {
    $.get("data.json")
        .done(function (data) {
            var obj = {};
            obj.paths = [];
            obj.amounts = [];
            obj.colors =  [];
            obj.offsets = [];
            data.forEach(function(building, index, collection){
                var CurrentFloor = 0;
                building.floors.forEach(function(floor, index){
                    obj.paths.push("M" + floor.footprint.join(" L")+ " Z");
                    obj.amounts.push(floor.height);
                    obj.offsets.push(CurrentFloor);
                    CurrentFloor+= floor.height;
                    obj.colors.push(Math.random() * 0xffffff);
                });
                if(building.roof){
                    //TODO check if there are always 2 points
                    var mesh = CreateRoof(building.rooftop, building.floors[building.floors.length-1], CurrentFloor, building.roofheight);

                    group.add(mesh);
                }
            });
            obj.center = { x:20, y:20 };
            addGeoObject( group, obj );
        });
}

function CreateRoof(rooftop, topfloor, maxheight,roofheight) {
    var NearestA = [];
    var NearestB = [];

    topfloor.footprint.forEach(function (pair) {
        NearestA.push(distance(rooftop[0], pair));
        NearestB.push(distance(rooftop[1], pair));
    });

    var MinIndecesA = FindMinimumValueIndices(NearestA);
    var MinIndecesB = FindMinimumValueIndices(NearestB);

    var geometry = new THREE.Geometry();
    //Triangular sides
    geometry.vertices.push(
        new THREE.Vector3(rooftop[0][0], rooftop[0][1], maxheight+roofheight),
        new THREE.Vector3(topfloor.footprint[MinIndecesA[0]][0], topfloor.footprint[MinIndecesA[0]][1], maxheight),
        new THREE.Vector3(topfloor.footprint[MinIndecesA[1]][0], topfloor.footprint[MinIndecesA[1]][1], maxheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], maxheight+roofheight),
        new THREE.Vector3(topfloor.footprint[MinIndecesB[0]][0], topfloor.footprint[MinIndecesB[0]][1], maxheight),
        new THREE.Vector3(topfloor.footprint[MinIndecesB[1]][0], topfloor.footprint[MinIndecesB[1]][1], maxheight)
    );

    var MaxMinA = MinIndecesA.max();
    var MaxMinB = MinIndecesB.max();
    var NextMaxA = MaxMinA +1;
    if(NextMaxA > 3){
        NextMaxA = 1;
    }
    var NextMaxB = MaxMinB +1;
    if(NextMaxB > 3){
        NextMaxB = 1;
    }

    //half roof
    geometry.vertices.push(
        new THREE.Vector3(rooftop[0][0], rooftop[0][1], maxheight+roofheight),
        new THREE.Vector3(topfloor.footprint[MaxMinA][0], topfloor.footprint[MaxMinA][1], maxheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], maxheight+roofheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], maxheight+roofheight),
        new THREE.Vector3(topfloor.footprint[MaxMinB][0], topfloor.footprint[MaxMinB][1], maxheight),
        new THREE.Vector3(topfloor.footprint[NextMaxB][0], topfloor.footprint[NextMaxB][1], maxheight)
    );

    MaxMinA = MinIndecesA.min();
    MaxMinB = MinIndecesB.min();
    NextMaxA = MaxMinA -1;
    if(NextMaxA < 0){
        NextMaxA = 1;
    }
    NextMaxB = MaxMinB -1;
    if(NextMaxB < 0){
        NextMaxB = 1;
    }

    //half roof
    geometry.vertices.push(
        new THREE.Vector3(rooftop[0][0], rooftop[0][1], maxheight+roofheight),
        new THREE.Vector3(topfloor.footprint[MaxMinA][0], topfloor.footprint[MaxMinA][1], maxheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], maxheight+roofheight),
        new THREE.Vector3(rooftop[1][0], rooftop[1][1], maxheight+roofheight),
        new THREE.Vector3(topfloor.footprint[MaxMinB][0], topfloor.footprint[MaxMinB][1], maxheight),
        new THREE.Vector3(topfloor.footprint[NextMaxB][0], topfloor.footprint[NextMaxB][1], maxheight)
    );

    var material = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff,
        side: THREE.DoubleSide
    });

    var normal = new THREE.Vector3( 0, 1, 0 );
    var color = new THREE.Color( Math.random() * 0xffffff );

    //TODO make it a foreach
    geometry.faces.push(new THREE.Face3(0, 1, 2, normal, Math.random() * 0xffffff));
    geometry.faces.push(new THREE.Face3(3, 4, 5, normal, Math.random() * 0xffffff));
    geometry.faces.push(new THREE.Face3(6, 7, 8, normal, color));
    geometry.faces.push(new THREE.Face3(9, 10, 11, normal, color));
    geometry.faces.push(new THREE.Face3(12, 13, 14, normal, color));
    geometry.faces.push(new THREE.Face3(15, 16, 17, normal, color));

    var materials = [
        new THREE.MeshPhongMaterial( { color: color, shading: THREE.FlatShading, vertexColors: THREE.VertexColors, shininess: 0, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial( { color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true } )
    ];

    var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, materials);
    //TODO got to get rid of translations, not really needed they are just stuck from the examples
    mesh.rotation.x = Math.PI;
    //mesh.translateZ(1);
    mesh.translateX(-20);
    mesh.translateY(-20);
    return mesh;
}

function distance(PointA, PointB){
    return Math.sqrt(Math.pow(PointB[0] - PointA[0], 2) + Math.pow(PointB[1] - PointA[1], 2));
}

function FindMinimumValueIndices(array)
{
    var MiniumValues = [];
    array.forEach(function(item, index){
        if(MiniumValues.length === 0){
            MiniumValues.push(index);
        }
        else if(MiniumValues.length === 1){
            MiniumValues.push(index);
        }
        var isBigger = true;
        if(index > 1){
            if(item < array[MiniumValues[0]]){
                MiniumValues[0] = index;
                isBigger = false;
            }
            if(item < array[MiniumValues[1]] && isBigger){
                MiniumValues[1] = index;
            }
        }
    });
    return MiniumValues;
}

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};