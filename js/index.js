'use strict';

let t = false;

const canvas = document.getElementById('app'),
      ctx = canvas.getContext('2d'),
      width = canvas.getAttribute('width'),
      height = canvas.getAttribute('height');

ctx.fillStyle = "black";
ctx.fillRect(0, 0, width, height);

let spheres = 
[
    {
        center: [0, -1, 3],
        r: 1,
        color: [255, 0, 0],
        specular: 500
    },
    {
        center: [-2, 1, 3], 
        r: 1,
        color: [0, 0, 255],
        specular: 500
    },
    {
        center: [2, 1, 3],
        r: 1,
        color: [0, 255, 0],
        specular: 10
    },
    {
        color: [255, 255, 0],
        center: [0, -5001, 0],
        r: 5000,
        specular: 1000
    }
];

let LightSources = [
    {
        type: 'directional',
        color: [255, 255, 255],
        direction: [1, 4, 4],
        intensity: 0.1
    },
    {
        type: 'point',
        color: [255, 255, 255],
        pos: [2, 1, 0],
        intensity: 0.9
    },
];

let AmbientLightIntensity = 0;

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

const intersectRaySchere = (R, sphere) => {
    let C = new Vector(sphere.center);
    C = C.mul(-1);

    let k1 = R.dot(R),
        k2 = 2 * C.dot(R),
        k3 = C.dot(C) - sphere.r * sphere.r;

    let det = k2 * k2 - 4 * k1 * k3;
    if (det < 0) return undefined;
    
    let t0 = (-k2 - Math.sqrt(det)) / 2 / k1;
    if (t0 < 1) return undefined;

    return t0;
}

const calcLighting = (N, P, V, specular) => {
    let intensity = 0;    

    for (let i = 0; i < LightSources.length; i += 1) {
        let L;
        if (LightSources[i].type === 'point') {
            L = new Vector(LightSources[i].pos);
            L = L.add(P.mul(-1));
        }
        else {
            L = new Vector(LightSources[i].direction);
        }

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

const traceRay = (Cx, Cy, buf) => {
    let Vx = Cx / max(width, height) * 2 * d,
        Vy = Cy / max(width, height) * 2 * d,
        Vz = d;

    let R = new Vector([Vx, Vy, Vz]);

    let min_t = 100000;
    let t;
    let min_t_color = [10, 10, 10],
        color;

    for(let i = 0; i < spheres.length; i += 1) {
        t = intersectRaySchere(R, spheres[i]);

        // if (Cx == 0 && Cy == -100) {
        //     console.log(t0, color, min_t, min_t_color, t0 < min_t);
        // }

        if (t !== undefined && t < min_t) {
            min_t = t;

            let C = new Vector(spheres[i].center);
            let N = R.mul(t).add(C.mul(-1));

            let lightIntensity = calcLighting(N, R.mul(t), R, spheres[i].specular);
            min_t_color = [spheres[i].color[0] * lightIntensity,
                           spheres[i].color[1] * lightIntensity,
                           spheres[i].color[2] * lightIntensity];
        }
    }

    return min_t_color;
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

            buf.putPixel(i, j, traceRay(Cx, Cy, buf));

            if (Cx == 0 && Cy == 0)
                console.log(traceRay(Cx, Cy, buf));
        }        
    }

    // buf = lowPassFilter(buf);

    ctx.putImageData(buf, 0, 0);
}

render();