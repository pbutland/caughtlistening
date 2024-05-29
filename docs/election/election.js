function lightenColour(colour, percent) {
    var num = parseInt(colour.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = (num >> 8 & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;

    return (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
}

function setBinValue(bins, idx, item, binRange, numBins) {
    const bin = bins[idx];
    const range = idx === 0 ? `< ${binRange}%` : idx === numBins - 1 ? `> ${binRange * numBins}%` : `${(binRange * idx)} - ${(binRange * (idx + 1))}%`;
    if (bin === undefined) {
        bins[idx] = {
            votes: 0,
            range: range,
        };
    }
    bins[idx].votes = bins[idx].votes + item.custom.state_votes;
}

async function loadState(state) {
    const stateName = state.ucName.toLowerCase().replace(/ dist. \d/, '').replaceAll(/ /g, '-');
    const baseUrl = 'https://projects.fivethirtyeight.com/polls/president-general';
    let polls = await fetch(`${baseUrl}/2024/${stateName}/polls.json`).then(response => response.json()).catch(err => console.log(err));
    // const baseUrl = 'http://localhost:3000/data/poll-results';
    // let polls = await fetch(`${baseUrl}/${stateName}.json`).then(response => response.json()).catch(err => console.log(err));

    // Filter based on date range
    // const dateRangeFilter = data.filter(item => Date.parse(item.endDate) > (new Date(new Date() - (90 * 24 * 60 * 60 * 1000))));

    // Filter out polls that don't include BOTH republican and democrat candidates or a sample size
    let eligiblePolls = polls && polls.filter(item => item.answers.find(i => i.party === 'Dem') && item.answers.find(i => i.party === 'Rep') && item.sampleSize);
    if (!eligiblePolls || eligiblePolls.length === 0) {
        // Fallback onto 2020 results
        polls = await fetch(`${baseUrl}/2020/${stateName}/polls.json`).then(response => response.json()).catch(err => console.log(err));;
        eligiblePolls = polls && polls.filter(item => item.answers.find(i => i.party === 'Dem') && item.answers.find(i => i.party === 'Rep') && item.sampleSize);
    }

    return { ucName: state.ucName, state_votes: state.custom.state_votes, polls: eligiblePolls };
}

async function load538Data() {
    const results = await fetch(
        'https://caughtlistening.net/election/data/base-map-data.json'
    ).then(response => response.json());
    const states = results.map(state => loadState(state));
    return await Promise.all(states);
}

async function transform538Data(data) {
    return data.map(state => {
        // Aggregate votes from all polls
        const demVotes = state.polls.reduce((partialSum, a) => partialSum + (parseInt(a.answers.find(i => i.party === 'Dem').pct) / 100) * a.sampleSize, 0);
        const repVotes = state.polls.reduce((partialSum, a) => partialSum + (parseInt(a.answers.find(i => i.party === 'Rep').pct) / 100) * a.sampleSize, 0);
        const totalVotes = state.polls.reduce((partialSum, a) => partialSum + parseInt(a.sampleSize), 0);

        const demPct = demVotes * 100 / totalVotes;
        const repPct = repVotes * 100 / totalVotes;
        const diff = repPct - demPct;
        return {
            ucName: state.ucName,
            value: diff.toFixed(2),
            custom: {
                winner: diff > 0 ? 'Republican' : 'Democrat',
                elVotesDem: diff < 0 ? state.state_votes : 0,
                elVotesRep: diff > 0 ? state.state_votes : 0,
                votesDem: demPct.toFixed(2),
                votesRep: repPct.toFixed(2),
                state_votes: state.state_votes,
            }
        };
    }).sort((lhs, rhs) => lhs.ucName.localeCompare(rhs.ucName));
}

let allData;
let numPollsters;
const MAX_POLLSTERS = 50;

async function update() {
    const voterAdult = document.getElementById("adult");
    const voterVoter = document.getElementById("voter");
    const voterRegistered = document.getElementById("registered");
    const voterLikely = document.getElementById("likely");

    const voterTypes = [];
    voterAdult.checked && voterTypes.push(voterAdult.value);
    voterVoter.checked && voterTypes.push(voterVoter.value);
    voterRegistered.checked && voterTypes.push(voterRegistered.value);
    voterLikely.checked && voterTypes.push(voterLikely.value);
    const data = JSON.parse(JSON.stringify(allData));

    const pollsters = [];
    for (let idx = 0; idx < numPollsters; ++idx) {
        const pollster = document.getElementById(`pollster-${idx}`);
        pollster.checked && pollsters.push(pollster.value);
    }

    data.forEach(state => {
        state.polls = state.polls.filter(poll => pollsters.includes(poll.pollster))
    });

    updateVoters(data);

    data.forEach(state => {
        state.polls = state.polls.filter(poll => voterTypes.includes(poll.population))
    });

    const transformedData = await transform538Data(data);
    updateDataTable(transformedData);
    initChart(transformedData);
}

async function updateVoters(data) {
    const populations = data.map(state => state.polls).flat().map(poll => { return { population: poll.population, sampleSize: parseInt(poll.sampleSize) }}).flat();
    const populationCounts = populations.reduce((p, c) => {
        let value = p.get(c.population);
        if (value === undefined) {
            value = 0;
        }
        value += c.sampleSize;
        return p.set(c.population, value);
    }, new Map());

    const adult = document.getElementById(`adult-label`);
    adult.innerText = ` Adult (${populationCounts.get('a').toLocaleString()})`;
    const voter = document.getElementById(`voter-label`);
    voter.innerText = ` Voter (${populationCounts.get('v').toLocaleString()})`;
    const registered = document.getElementById(`registered-label`);
    registered.innerText = ` Registered (${populationCounts.get('rv').toLocaleString()})`;
    const likely = document.getElementById(`likely-label`);
    likely.innerText = ` Likely (${populationCounts.get('lv').toLocaleString()})`;
}

async function addPollsters(data) {
    const allPollsters = data.map(state => state.polls).flat().map(poll => poll.pollster);
    const pollsterCounts = allPollsters.reduce((p, c) => {
        let value = p.get(c);
        if (value === undefined) {
            value = 0;
        }
        value++;
        return p.set(c, value);
    }, new Map());

    const sortedPollsters = new Map([...pollsterCounts.entries()].sort((a, b) => b[1] - a[1]));
    const pollsters = Array.from(sortedPollsters.entries());
    numPollsters = MAX_POLLSTERS === -1 ? pollsters.length : MAX_POLLSTERS;
    const topPollsters = pollsters.slice(0, numPollsters);
    const pollstersDiv = document.getElementById("pollsters");
    pollstersDiv.innerHTML = '';
    topPollsters.forEach((item, index) => {
        const div = document.createElement('div');
        const input = document.createElement('input');
        input.id = `pollster-${index}`;
        input.type = 'checkbox';
        input.name = item[0];
        input.value = item[0];
        input.checked = true;
        input.onclick = update;
        div.appendChild(input);
        const label = document.createElement('label');
        label.for = item[0];
        label.innerText = ` ${item[0]} (${item[1].toLocaleString()})`;
        div.appendChild(label);
        pollstersDiv.appendChild(div);
    });
}

async function updateDataTable(data) {
    // Sum electoral college votes
    const demVotes = data.reduce((partialSum, a) => partialSum + a.custom.elVotesDem, 0);
    const repVotes = data.reduce((partialSum, a) => partialSum + a.custom.elVotesRep, 0);

    data.unshift({
        ucName: 'NATIONAL',
        value: undefined,
        custom: {
            winner: repVotes > demVotes ? 'Republican' : 'Democrat',
            elVotesDem: demVotes,
            elVotesRep: repVotes,
            votesDem: undefined,
            votesRep: undefined,
            state_votes: null
        }
    });

    let element = document.getElementById('info-dem1');
    element.innerHTML = `Biden: ${demVotes}`;

    element = document.getElementById('info-rep1');
    element.innerHTML = `Trump: ${repVotes}`;

    // Add data values to data table and
    // create histogram for electoral college votes
    const min = 0;
    const binRange = 2;
    const numberOfBins = 10;
    const demBins = new Array(numberOfBins);
    const repBins = new Array(numberOfBins);
    const table = document.getElementById("data-table").getElementsByTagName('tbody')[0];
    table.innerHTML = '';
    data.forEach((item, index) => {
        // Add values to data table
        const newRow = table.insertRow();
        newRow.className = 'datagrid-row';
        const state = newRow.insertCell(0);
        state.className = 'datagrid-cell';
        const democrat = newRow.insertCell(1);
        democrat.className = 'datagrid-cell';
        const republican = newRow.insertCell(2);
        republican.className = 'datagrid-cell';
        const demVotes = newRow.insertCell(3);
        demVotes.className = 'datagrid-cell';
        const repVotes = newRow.insertCell(4);
        repVotes.className = 'datagrid-cell';
        state.innerHTML = item.ucName;
        democrat.innerHTML = item.custom.elVotesDem;
        republican.innerHTML = item.custom.elVotesRep;
        demVotes.innerHTML = isNaN(item.custom.votesDem) ? '-' : `${item.custom.votesDem}%`;
        repVotes.innerHTML = isNaN(item.custom.votesRep) ? '-' : `${item.custom.votesRep}%`;

        // Add values to histogram
        if (index > 0) { // ignore national
            const votes = Math.abs(item.value);
            const idx = Math.min(Math.floor((votes - min) / binRange), numberOfBins - 1);
            if (item.custom.winner === 'Republican') {
                setBinValue(repBins, idx, item, binRange, numberOfBins);
            } else {
                setBinValue(demBins, idx, item, binRange, numberOfBins);
            }
        }
    });

    // create divs for result bar
    let demColour = '#0913df';
    const resultsBar = document.getElementById("results-bar");
    resultsBar.innerHTML = '';
    let firstNonZero = true;
    demBins.reverse().forEach((item, index) => {
        const div = document.createElement('div');
        firstNonZero = firstNonZero && item.votes !== 0;
        if (firstNonZero) {
            div.style.borderRadius = '10px 0px 0px 10px';
            firstNonZero = false;
        }
        div.style.width = `${item.votes * 100 / 538}%`;
        div.style.background = demColour;
        if (!!item && item.votes !== 0) {
            div.innerText = item.votes;
            const span = document.createElement('span');
            span.className = 'bar-segment-tooltip';
            span.innerText = `${item.range}`;
            div.appendChild(span);
        }
        div.className = 'bar-segment';
        resultsBar.appendChild(div);
        demColour = `#${lightenColour(demColour, 7)}`;
    });

    const diff = 538 - demVotes - repVotes;
    if (diff > 0) {
        const div = document.createElement('div');
        if (diff === 538) {
            div.style.borderRadius = '10px';
        } else if (demVotes === 0) {
            div.style.borderRadius = '10px 0px 0px 10px';
        } else if (repVotes === 0) {
            div.style.borderRadius = '0px 10px 10px 0px';
        }
        div.style.width = `${diff * 100 / 538}%`;
        div.style.background = '#fff';
        div.className = 'bar-segment';
        resultsBar.appendChild(div);
    }

    let repColour = '#df1309';
    firstNonZero = true;
    const repDivs = repBins.reverse().map((item, index) => {
        const div = document.createElement('div');
        firstNonZero = firstNonZero && item.votes !== 0;
        if (firstNonZero) {
            div.style.borderRadius = '0px 10px 10px 0px';
            firstNonZero = false;
        }
        div.style.width = `${item.votes * 100 / 538}%`;
        div.style.background = repColour;
        if (!!item && item.votes !== 0) {
            div.innerText = item.votes;
            const span = document.createElement('span');
            span.className = 'bar-segment-tooltip';
            span.innerText = `${item.range}`;
            div.appendChild(span);
        }
        div.className = 'bar-segment';
        repColour = `#${lightenColour(repColour, 7)}`;
        return div;
    });
    repDivs.reverse().forEach(div => {
        resultsBar.appendChild(div);
    });
}

let topology;
async function initChart(data) {
    if (!topology) {
        topology = await fetch(
            'https://code.highcharts.com/mapdata/countries/us/us-all.topo.json'
        ).then(response => response.json());

        // Prepare map data for joining
        topology.objects.default.geometries.forEach(function (g) {
            if (g.properties && g.properties.name) {
                g.properties.ucName = g.properties.name.toUpperCase();
            }
        });
    }

    Highcharts.mapChart('map-container', {
        title: {
            text: 'US Electoral College Poll Results 2024',
            align: 'center'
        },

        mapNavigation: {
            enabled: true,
            enableButtons: false
        },

        xAxis: {
            labels: {
                enabled: false
            }
        },

        colorAxis: {
            labels: {
                format: '{value}%'
            },
            stops: [
                [0, '#0913df'], // Blue
                [0.5, '#caccfd'], // Light Blue
                [0.51, '#fdccca'], // Light Red
                [1, '#df1309'] // Red
            ],
            min: -20,
            max: 20
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<table class="map-tooltip"><caption>{point.key}</caption><tr><th>Party</th><th>Electors</th><th>Votes</th></tr>',
            pointFormat: '<tr><td>Dem.</td><td>{point.custom.elVotesDem}</td><td>{point.custom.votesDem}%</td></tr>' +
                '<tr><td>Rep.</td><td>{point.custom.elVotesRep}</td><td>{point.custom.votesRep}%</td></tr>' +
                '<tr><th colspan="3">{point.custom.winner}</th></tr>',
            footerFormat: '</table>'
        },
        series: [{
            mapData: topology,
            data,
            joinBy: 'ucName',
            name: 'US Electoral College Poll',
            dataLabels: {
                enabled: true,
                format: '{point.properties.hc-a2} ({point.custom.state_votes})',
                style: {
                    fontSize: '10px'
                }
            },
        }, {
            // The connector lines
            type: 'mapline',
            data: Highcharts.geojson(topology, 'mapline'),
            color: 'silver',
            accessibility: {
                enabled: false
            }
        }]
    });
}

(async () => {
    allData = await load538Data();
    updateVoters(allData);
    addPollsters(allData);
    update();
})();
