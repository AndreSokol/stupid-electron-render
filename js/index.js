const canvas = document.getElementById('app'),
      ctx = canvas.getContext('2d'),
      width = canvas.getAttribute('width'),
      height = canvas.getAttribute('height');

ctx.fillStyle = "black";
ctx.fillRect(0, 0, width, height);

let Sphere = {
    x: 0,
    y: 10,
    z: 0,
    r: 5,
};

const createBuffer = () => {
    let buf = ctx.createImageData(width, height);

    buf.getData = function(x, y) {
        let ind = (y * this.width + x) * 4;
        return this.data.slice(ind, ind + 3);
    }

    buf.setData = function(x, y, arr) {
        let ind = (y * this.width + x) * 4;
        
        this.data[ind] = arr[0];
        this.data[ind + 1] = arr[1];
        this.data[ind + 2] = arr[2];
        this.data[ind + 3] = 255;
    }

    return buf;
};

const render = () => {
    let buf = createBuffer();

    for(let i = 0; i < width; i++) {
        for(let j = 0; j < height; j++) {
            let data = [Math.round(Math.random() * 255),
                        Math.round(Math.random() * 255),
                        Math.round(Math.random() * 255)];
            buf.setData(i, j, data);        
        }
    }

    ctx.putImageData(buf, 0, 0);
}

render();