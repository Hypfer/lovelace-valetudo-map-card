import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import serve from 'rollup-plugin-serve';

const dev = process.env.ROLLUP_WATCH;

/** @type {import("rollup-plugin-serve").ServeOptions} */
const serveOpts = {
    contentBase: ['./dist'],
    host: '0.0.0.0',
    port: 5000,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
};

const plugins = [
    nodeResolve({}),
    commonjs(),
    typescript(),
    json(),
    babel({
        exclude: "node_modules/**",
        plugins: [
            ["inline-json-import", {}]
        ]
    }),
    dev && serve(serveOpts),
    !dev && terser(),
];

export default [
    {
        input: "src/valetudo-map-card.js",
        output: {
            dir: "dist",
            format: "es",
        },
        plugins: [...plugins],
    },
];
