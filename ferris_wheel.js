"use strict";

var canvas;
var gl;

// var numPositions  = 36;

var positions = [];
var colors = [];

const BLA = vec4(0.0, 0.0, 0.0, 1.0);  // black
const RED = vec4(1.0, 0.0, 0.0, 1.0);  // red
const ORA = vec4(1.0, 0.5, 0.0, 1.0);  // orange
const YEL = vec4(0.99, 0.99, 0.0, 1.0);  // yellow
const GRE = vec4(0.0, 1.0, 0.0, 1.0);  // green
const BLU = vec4(0.0, 0.0, 1.0, 1.0);  // blue
const MAG = vec4(1.0, 0.0, 1.0, 1.0);  // magenta
const CYA = vec4(0.0, 1.0, 1.0, 1.0);  // cyan
const PUR = vec4(0.5, 0.0, 0.5, 1.0);  // purple
const WHI = vec4(1.0, 1.0, 1.0, 1.0);  // white

const basket_colors = [RED, ORA, YEL, GRE, CYA, BLU, MAG, PUR];
var basket_rotation = [0,0,0,0,0,0,0,0];

var wheelPoints = [];
var numWheelPoints = 16;

const wheel_scale = 0.70;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 2;
var theta = [0, 0, 0];

var thetaLoc;

const rad = 0.015
const c = Math.cos(rad)
const s = Math.sin(rad)
const rotz = mat4(c, -s,0,0,
                s, c,0,0,
                0, 0, 1, 0,
                0, 0, 0, 1)

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    basket_rotation[0] = document.getElementById("box0").value;
    basket_rotation[1] = document.getElementById("box1").value;
    basket_rotation[2] = document.getElementById("box2").value;
    basket_rotation[3] = document.getElementById("box3").value;
    basket_rotation[4] = document.getElementById("box4").value;
    basket_rotation[5] = document.getElementById("box5").value;
    basket_rotation[6] = document.getElementById("box6").value;
    basket_rotation[7] = document.getElementById("box7").value;

    //colorCube();
    default_points(0.15);
    default_points(-0.15);
    default_points(0);
    draw_wheel(0.15);
    draw_supports(0.15);
    for (let i = 16; i < 24; i++){
        draw_basket(wheelPoints[i],basket_rotation[i-16],basket_colors[i-16]);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    render()
    
}


function v_scale2(s, v) {
    var result = new Array(v.length);
    result.type = v.type;
    for (let i = 0; i < 2; i++) {
        result[i] = s*v[i];
    }
    for (let i = 2; i < v.length; i++) {
        result[i] = v[i];
    }
    return result;
}

function v_add3(u, v) {
    var result = new Array(v.length);
    result.type = v.type;
    for (let i = 0; i < 3; i++) {
        result[i] = u[i] + v[i];
    }
    result[3] = 1;
    return result;
}

function v_sub3(u, v) {
    var result = new Array(v.length);
    result.type = v.type;
    for (let i = 0; i < 3; i++) {
        result[i] = u[i] - v[i];
    }
    result[3] = 1;
    return result;
}

function default_points(z) {
    // wheelPoints = [];
    wheelPoints.push(v_scale2(wheel_scale,vec4(0,1,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(.707,.707,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(1,0,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(.707,-.707,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(0,-1,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(-.707,-.707,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(-1,0,z,1)));
    wheelPoints.push(v_scale2(wheel_scale,vec4(-.707,.707,z,1)));

}

function triangles_from_square(p1,p2,p3,p4, colo=BLA){
    positions.push(p1);
    colors.push(colo);
    positions.push(p2);
    colors.push(colo);
    positions.push(p3);
    colors.push(colo);

    positions.push(p2);
    colors.push(colo);
    positions.push(p3);
    colors.push(colo);
    positions.push(p4);
    colors.push(colo);
}

function cross_prod_len(v1, v2, my_len) {
	var cross_prod = cross(v1, v2);
	cross_prod = normalize(cross_prod);
    var result = new Array(v1.length);
    result.type = v1.type;
    for (let i = 0; i < cross_prod.length; i++) {
        result[i] = my_len*cross_prod[i];
    }
    result[3] = 1;
	return result;
}

function draw_tube(p1, p2, perpen, rad, colo) {
    var dia1 = [];
    var dia2 = [];

    var vector = v_sub3(p2, p1);
    dia1.push(v_add3(p1, cross_prod_len(perpen, vector, rad)));
    dia1.push(v_add3(p1, mult(rad,perpen)));
    dia1.push(v_sub3(p1, cross_prod_len(perpen, vector, rad)));
    dia1.push(v_sub3(p1, mult(rad,perpen)));

    vector = v_sub3(p1, p2);
    dia2.push(v_add3(p2, cross_prod_len(perpen, vector, rad)));
    dia2.push(v_add3(p2, mult(rad,perpen)));
    dia2.push(v_sub3(p2, cross_prod_len(perpen, vector, rad)));
    dia2.push(v_sub3(p2, mult(rad,perpen)));

    // var triangles = [];
    for (let i = 0; i < 4; i++) {
        var r1 = dia1[i];
        var r2 = dia2[i];
        var r3 = dia1[(i+1)%4];
        var r4 = dia2[(i+1)%4];
        triangles_from_square(r1,r2,r3,r4, colo=BLA);
    }

}

function draw_wheel(z) {
    var thicc = 0.01;

    var center1 = vec4(0,0,z,1);
    var center2 = vec4(0,0,(-z),1);

    // wheel 1
    for (let i = 0; i < 8; i++) {
        var a = wheelPoints[i];
        var b = wheelPoints[(i+1)%8];
        draw_tube(a, b, vec4(0,0,1,1), thicc);
        draw_tube(a, center1, vec4(0,0,1,1), thicc);
    }

    // wheel 2
    for (let i = 8; i < 16; i++) {
        var a = wheelPoints[i];
        var b = wheelPoints[8+(i+1)%8];
        draw_tube(a, b, vec4(0,0,1,1), thicc);
        draw_tube(a, center2, vec4(0,0,1,1), thicc);
    }

    draw_tube(center1, center2, vec4(0,1,0,1), thicc);
}

function draw_supports(z) {
    var thicc = 0.05
    var centera = vec4(0,0,z,1);
    var side1a = vec4(0.4,0.8,z,1);
    var side2a = vec4(-0.4,0.8,z,1);
    draw_tube(centera, side1a, vec4(0,0,1,1), thicc);
    draw_tube(centera, side2a, vec4(0,0,1,1), thicc);
    draw_tube(side1a, side2a, vec4(0,0,1,1), thicc);

    var centerb = vec4(0,0,-z,1);
    var side1b = vec4(0.4,0.8,-z,1);
    var side2b = vec4(-0.4,0.8,-z,1);
    draw_tube(centerb, side1b, vec4(0,0,1,1), thicc);
    draw_tube(centerb, side2b, vec4(0,0,1,1), thicc);
    draw_tube(side1b, side2b, vec4(0,0,1,1), thicc);

    draw_tube(side1a, side1b, vec4(0,1,0,1), thicc);
    draw_tube(side2a, side2b, vec4(0,1,0,1), thicc);
}

function draw_basket(center, rotation, colo){
    const size = .1;
    const height = .1;
    const points = [];
    points.push(vec4(-size,0,-size,1));
    points.push(vec4(-size,0,size,1));
    points.push(vec4(size,0,size,1));
    points.push(vec4(size,0,-size,1));
    points.push(vec4(-size,-height,-size,1));
    points.push(vec4(-size,-height,size,1));
    points.push(vec4(size,-height,size,1));
    points.push(vec4(size,-height,-size,1));

    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const rotmat = mat4(c, -s,0,0,
        s, c,0,0,
        0, 0, 1, 0,
        0, 0, 0, 1);

    for (let i = 0; i < points.length; i++){
        points[i] = mult(rotmat, points[i]);
        points[i] = v_add3(center, points[i]);
    }

    triangles_from_square(points[2],points[3],points[1],points[0], colo);
    triangles_from_square(points[6],points[7],points[5],points[4], colo);
    triangles_from_square(points[0],points[1],points[4],points[5], colo);
    triangles_from_square(points[1],points[2],points[5],points[6], colo);
    triangles_from_square(points[2],points[3],points[6],points[7], colo);
    triangles_from_square(points[3],points[0],points[7],points[4], colo);
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    theta[xAxis] = document.getElementById("x").value;
    theta[yAxis] = document.getElementById("y").value;
    theta[zAxis] = document.getElementById("z").value;
    gl.uniform3fv(thetaLoc, theta);

    for (let i = 0; i < 792; i++){
        positions[i] = mult(rotz,positions[i]);
    }
    
    //clear the end of the position matrix where the baskets would be
    positions.length = 984;
    colors.length = 984;

    basket_rotation[0] = document.getElementById("box0").value;
    basket_rotation[1] = document.getElementById("box1").value;
    basket_rotation[2] = document.getElementById("box2").value;
    basket_rotation[3] = document.getElementById("box3").value;
    basket_rotation[4] = document.getElementById("box4").value;
    basket_rotation[5] = document.getElementById("box5").value;
    basket_rotation[6] = document.getElementById("box6").value;
    basket_rotation[7] = document.getElementById("box7").value;

    for (let i = 16; i < 24; i++){
        wheelPoints[i] = mult(rotz,wheelPoints[i]);
        draw_basket(wheelPoints[i],basket_rotation[i-16],basket_colors[i-16]);
    }

    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
    requestAnimationFrame(render);
}
