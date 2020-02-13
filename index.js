'use strict';

const { Session } = require('inspector');
const { promisify } = require('util');

// exported from "collect-v8-coverage" package
class CoverageInstrumenter {
    constructor() {
        this.session = new Session();

        this.postSession = promisify(this.session.post.bind(this.session));
    }

    async startInstrumenting() {
        this.session.connect();

        await this.postSession('Profiler.enable');

        await this.postSession('Profiler.startPreciseCoverage', {
            callCount: true,
            detailed: true,
        });
    }

    async stopInstrumenting() {
        const {result} = await this.postSession(
            'Profiler.takePreciseCoverage',
        );

        await this.postSession('Profiler.stopPreciseCoverage');

        await this.postSession('Profiler.disable');
        return result;
    }
}

async function showCoverage()
{
    const instrumener = new CoverageInstrumenter();
    await instrumener.startInstrumenting();
    const {add} = require('./testme');
    add(1,2);
    const coverage = await instrumener.stopInstrumenting();
    const needFile = coverage.find(object=>object.url.includes('testme.js'));
    console.log(JSON.stringify(needFile, null, 2));
}


async function run()
{
    console.log('Attempt 1, full coverage:');
    await showCoverage();
    console.log('Attempt 2, partial coverage:');
    await showCoverage();
}

run();
