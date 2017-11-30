"use strict";

class Vector {
    constructor(coords) {
        this.coords = coords;
    }

    add(other) {
        let ans = [];
        for(let i = 0; i < this.coords.length; i += 1) {
            ans.push(this.coords[i] + other.coords[i]);
        }

        return new Vector(ans);
    }

    sub(other) {
        let ans = [];
        for(let i = 0; i < this.coords.length; i += 1) {
            ans.push(this.coords[i] - other.coords[i]);
        }

        return new Vector(ans);
    }


    mul(q) {
        let ans = [];
        for(let i = 0; i < this.coords.length; i += 1) {
            ans.push(this.coords[i] * q);
        }
        return new Vector(ans);
    }

    dot(other) {
        let ans = 0;

        for(let i = 0; i < this.coords.length; i += 1) {
            ans += this.coords[i] * other.coords[i];
        }

        return ans;
    }

    invert() {
        console.log(this.coords);
        for(let i = 0; i < this.coords.length; i += 1) {
            this.coords[i] *= -1;
        }
        console.log(this.coords);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    mirror_over(other) {
        return other.mul(2 * other.dot(this)).add(this.mul(-1));
    }

    cos(other) {
        return this.dot(other) / this.length() / other.length();
    }
}

const max = (x, y) => {
    if (x > y) return x;
    return y;
};

const min = (x, y) => {
    if (x < y) return x;
    return y;
};