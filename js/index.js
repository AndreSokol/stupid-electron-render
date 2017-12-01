'use strict';

let t = false;

const canvas = document.getElementById('app'),
      ctx = canvas.getContext('2d'),
      width = canvas.getAttribute('width'),
      height = canvas.getAttribute('height');

ctx.fillStyle = "black";
ctx.fillRect(0, 0, width, height);

const CLIPPING_DIST = 10000;
const DEPTH_LIMIT = 1;

let spheres = 
[
    {
        center: [0, -1, 3],
        r: 1,
        color: [255, 0, 0],
        specular: 500,
        reflective: 0.5,
    },
    {
        center: [-2, 1, 3],
        r: 1,
        color: [0, 0, 255],
        specular: 500,
        reflective: 0.3
    },
    {
        center: [2, 1, 3],
        r: 1,
        color: [0, 255, 0],
        specular: 10,
        reflective: 0.4
    },
    {
        color: [255, 255, 0],
        center: [0, -5001, 0],
        r: 5000,
        specular: 1000,
        reflective: 0.5
    }
];


let LightSources = [
    {
        type: 'directional',
        color: [255, 255, 255],
        direction: [1, 4, 4],
        intensity: 0.2
    },
    {
        type: 'point',
        color: [255, 255, 255],
        pos: [2, 1, 0],
        intensity: 0.6
    },
];

let AmbientLightIntensity = 0.2;

const StoW = (Sx, Sy) => {
    let Cx = Sx,
        Cy = Sy;

    Cx = Cx - width / 2;
    Cy = -(Cy - height / 2);

    return {Cx, Cy};
}

const d = 1;

const createBuffer = () => {
    let buf = ctx.createImageData(width, height);

    buf.getPixel = function(i, j) {
        let x = i;
        let y = j;
        let ind = (y * this.width + x) * 4;
        return this.data.slice(ind, ind + 3);
    }

    buf.putPixel = function(i, j, arr) {
        let x = i;
        let y = j;

        let ind = (y * this.width + x) * 4;
        
        this.data[ind] = arr[0];
        this.data[ind + 1] = arr[1];
        this.data[ind + 2] = arr[2];
        this.data[ind + 3] = 255;
    }

    return buf;
};

const intersectRaySphere = (O, R, sphere) => {
    // let R = D.sub(O);

    let C = new Vector(sphere.center);
    C = O.sub(C);

    let k1 = R.dot(R),
        k2 = 2 * C.dot(R),
        k3 = C.dot(C) - sphere.r * sphere.r;

    let det = k2 * k2 - 4 * k1 * k3;
    let t0, t1;
    if (det < 0) t0 = undefined, t1 = undefined;
    else {
        t0 = (-k2 - Math.sqrt(det)) / 2 / k1;
        t1 = (-k2 + Math.sqrt(det)) / 2 / k1;          
    }

    return {t0, t1};
}

const findIntersection = (O, R, t_min=1, t_max=CLIPPING_DIST, closest=true) => {
    let closest_t = CLIPPING_DIST;
    let closest_sphere = null;

    for(let i = 0; i < spheres.length; i += 1) {
        let {t0, t1} = intersectRaySphere(O, R, spheres[i]);

        if (t0 !== undefined && t0 < closest_t && t0 >= t_min && t0 <= t_max) {
            closest_t = t0;
            closest_sphere = spheres[i];
            if (!closest) break;
        }
        if (t1 !== undefined && t1 < closest_t && t1 >= t_min && t1 <= t_max) {
            closest_t = t1;
            closest_sphere = spheres[i];
            if (!closest) break;
        }

    }

    return {t: closest_t, sphere: closest_sphere};
};

const calcLighting = (N, P, V, specular) => {
    let intensity = 0;    

    for (let i = 0; i < LightSources.length; i += 1) {
        let L;
        if (LightSources[i].type === 'point') {
            L = new Vector(LightSources[i].pos);
            L = L.add(P.mul(-1));

            // SHADOWS
            let {t, sphere} = findIntersection(P, L, 0.01, 1);
            if (sphere !== null) continue;
        }
        else {
            L = new Vector(LightSources[i].direction);

            // SHADOWS
            let {t, sphere} = findIntersection(P, L, 0.01);
            if (sphere !== null) continue;
        }

        // Check for shadows

        let NdotL = N.dot(L);

        if (NdotL > 0) {
            intensity += LightSources[i].intensity * NdotL / N.length() / L.length();
        }

        if (specular != 1) {
            let R = V.mirror_over(N);
            let RdotV = R.dot(V);
            if (RdotV > 0)
                intensity += LightSources[i].intensity * (R.cos(L) ** specular);
        }
    }


    intensity += AmbientLightIntensity;

    return intensity;
}


const traceRay = (O, R, depth=1) => {
    if (depth == 1) {
        var {t, sphere} = findIntersection(O, R);
    } 
    else {
        var {t, sphere} = findIntersection(O, R, 0.001);
    } 

    if (sphere === null) return [0, 0, 0];

    //if (Cx == -200 && Cy == -100) console.log(min_t_sphere);
    let C = new Vector(sphere.center);
    let N = R.mul(t).add(C.mul(-1));
    N = N.mul(1 / N.length());

    let lightIntensity = calcLighting(N, R.mul(t), R, sphere.specular);

    let color = [sphere.color[0] * lightIntensity,
                 sphere.color[1] * lightIntensity,
                 sphere.color[2] * lightIntensity];

    if (depth == DEPTH_LIMIT) return color;

    let reflected_color = traceRay(R.mul(t), R.mirror_over(N).mul(-1), depth + 1);

    //if (reflected_color[0] !== 0) return [255, 255, 255];

    for (let i = 0; i < 3; i += 1)
        color[i] = color[i] * (1 - sphere.reflective) + reflected_color[i] * sphere.reflective;

    return color;
}


const lowPassFilter = (buf) => {
    let new_buf = Object.assign(buf);

    for (let i = 1; i < width - 1; i += 1) {
        for (let j = 1; j < height - 1; j += 1) {
            let color = buf.getPixel(i, j);
            color[0] *= 0.5;
            color[1] *= 0.5;
            color[2] *= 0.5;

            let color_nb = buf.getPixel(i - 1, j);
            color[0] += 0.125 * color_nb[0];
            color[1] += 0.125 * color_nb[1];
            color[2] += 0.125 * color_nb[2];

            color_nb = buf.getPixel(i + 1, j);
            color[0] += 0.125 * color_nb[0];
            color[1] += 0.125 * color_nb[1];
            color[2] += 0.125 * color_nb[2];

            color_nb = buf.getPixel(i, j - 1);
            color[0] += 0.125 * color_nb[0];
            color[1] += 0.125 * color_nb[1];
            color[2] += 0.125 * color_nb[2];

            color_nb = buf.getPixel(i, j + 1);
            color[0] += 0.125 * color_nb[0];
            color[1] += 0.125 * color_nb[1];
            color[2] += 0.125 * color_nb[2];

            new_buf.putPixel(i, j, color);
        }
    }

    return new_buf;
}

const render = () => {
    let buf = createBuffer();

    for(let i = 0; i <= width; i += 1)
    {
        for(let j = 0; j <= height; j += 1) {
            let {Cx, Cy} = StoW(i, j);

            let Vx = Cx / max(width, height) * d,
                Vy = Cy / max(width, height) * d,
                Vz = d;

            let O = new Vector([0, 0, 0]);
            let R = new Vector([Vx, Vy, Vz]);

            buf.putPixel(i, j, traceRay(O, R));
        }

    }

    ctx.putImageData(buf, 0, 0);
}

render();