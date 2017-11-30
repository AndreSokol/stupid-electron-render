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
    },
    {
        center: [2, 0, 4], 
        r: 1,
        color: [0, 0, 255],  
    },
    {
        center: [-2, 0, 4],
        r: 1,
        color: [0, 255, 0]
    },
    {
        color: [255, 255, 0],
        center: [0, -5001, 0],
        r: 5000,
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
        intensity: 0.8
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

const calcLighting = (N, P) => {
    let intensity = 0;    

    // if (!t) console.log(N.length(), N);
    // t = true;

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

            let lightIntensity = calcLighting(N, R.mul(t));
            min_t_color = [spheres[i].color[0] * lightIntensity,
                           spheres[i].color[1] * lightIntensity,
                           spheres[i].color[2] * lightIntensity];
        }
    }

    return min_t_color;
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

    ctx.putImageData(buf, 0, 0);
}

render();