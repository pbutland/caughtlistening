async function loadState(state) {
    const stateName = state.ucName.toLowerCase().replace(/ dist. \d/, '').replaceAll(/ /g, '-');
    const baseUrl = 'https://projects.fivethirtyeight.com/polls/president-general';
    let polls = await fetch(`${baseUrl}/2024/${stateName}/polls.json`).then(response => response.json()).catch(err => console.log(err));
    // const baseUrl = 'http://localhost:3000/data/poll-results';
    // let polls = await fetch(`${baseUrl}/${stateName}.json`).then(response => response.json()).catch(err => console.log(err));

    const district = /.* DIST. \d{1}/.test(state.ucName) ? state.ucName.match(/.* DIST. (\d{1})/)[1] : undefined;
    // Filter out polls that don't include BOTH republican and democrat candidates or a sample size
    let eligiblePolls = polls && polls.filter(poll => poll.answers.find(a => a.party === 'Dem') && poll.answers.find(a => a.party === 'Rep') && poll.sampleSize && district === poll.district);
    if (!eligiblePolls || eligiblePolls.length === 0) {
        // Fallback onto 2020 results
        polls = await fetch(`${baseUrl}/2020/${stateName}/polls.json`).then(response => response.json()).catch(err => console.log(err));;
        // polls = await fetch(`${baseUrl}/${stateName}.json`).then(response => response.json()).catch(err => console.log(err));
        eligiblePolls = polls && polls.filter(poll => poll.answers.find(a => a.party === 'Dem') && poll.answers.find(a => a.party === 'Rep') && poll.sampleSize && district === poll.district);
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
    let nationalDemVotes = 0;
    let nationalRepVotes = 0;
    let nationalDemElVotes = 0;
    let nationalRepElVotes = 0;
    let nationalTotalVotes = 0;
    const transformed = data.map(state => {
        if (state.polls.length === 0) {
            return {
                ucName: state.ucName,
                value: 0,
                custom: {
                    state_votes: state.state_votes,
                    elVotesDem: 0,
                    elVotesRep: 0,
                    votesDem: 0,
                    votesRep: 0,
                }
            }
        }

        // Aggregate votes from all polls
        const demVotes = state.polls.reduce((partialSum, a) => partialSum + (parseInt(a.answers.find(i => i.party === 'Dem').pct) / 100) * parseInt(a.sampleSize), 0);
        const repVotes = state.polls.reduce((partialSum, a) => partialSum + (parseInt(a.answers.find(i => i.party === 'Rep').pct) / 100) * parseInt(a.sampleSize), 0);
        const totalVotes = state.polls.reduce((partialSum, a) => partialSum + parseInt(a.sampleSize), 0);

        const demPct = demVotes * 100 / totalVotes;
        const repPct = repVotes * 100 / totalVotes;
        const diff = repPct - demPct;
        const demElVotes = diff < 0 ? state.state_votes : 0;
        const repElVotes = diff > 0 ? state.state_votes : 0;

        nationalDemVotes += demVotes;
        nationalRepVotes += repVotes;
        nationalDemElVotes += demElVotes;
        nationalRepElVotes += repElVotes;
        nationalTotalVotes += totalVotes;

        const earliestDate = Math.min.apply(null, state.polls.map(poll => Date.parse(poll.endDate)));
        const latestDate = Math.max.apply(null, state.polls.map(poll => Date.parse(poll.endDate)));

        return {
            ucName: state.ucName,
            value: isNaN(diff) ? 0 : diff.toFixed(2),
            custom: {
                winner: diff > 0 ? 'Republican' : 'Democrat',
                elVotesDem: demElVotes,
                elVotesRep: repElVotes,
                votesDem: demPct.toFixed(2),
                votesRep: repPct.toFixed(2),
                state_votes: state.state_votes,
                sample_size: totalVotes,
                latestPollDate: latestDate === earliestDate ? new Date(latestDate).toLocaleDateString() : `${new Date(earliestDate).toLocaleDateString()} - ${new Date(latestDate).toLocaleDateString()}`,
            }
        };
    }).sort((lhs, rhs) => lhs.ucName.localeCompare(rhs.ucName));

    const nationalDemPct = nationalDemVotes * 100 / nationalTotalVotes;
    const nationalRepPct = nationalRepVotes * 100 / nationalTotalVotes;
    const nationalDiff = nationalRepPct - nationalDemPct;

    transformed.unshift({
        ucName: 'NATIONAL',
        value: nationalDiff,
        custom: {
            winner: nationalRepVotes > nationalDemVotes ? 'Republican' : 'Democrat',
            elVotesDem: nationalDemElVotes,
            elVotesRep: nationalRepElVotes,
            votesDem: nationalDemPct.toFixed(2),
            votesRep: nationalRepPct.toFixed(2),
            state_votes: null
        }
    });

    return transformed;
}

let allData;
let numPollsters;

async function update(event, includeTableMetaData = true, minDate, maxDate) {
    if (event?.target?.id?.startsWith('pollster-') && !event?.target?.checked) {
        document.getElementById('pollster-all').checked = false;
    }
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

    if (minDate && maxDate) {
        data.forEach(state => {
            const polls = state.polls.filter(poll => Date.parse(poll.endDate) > minDate && Date.parse(poll.endDate) < maxDate);
            if (polls.length !== 0) {
                // Revert to historical data if no polls within timeframe
                state.polls = polls;
            }
        });
    }

    data.forEach(state => {
        state.polls = state.polls.filter(poll => pollsters.includes(poll.pollster));
    });

    updateVoters(data);

    data.forEach(state => {
        state.polls = state.polls.filter(poll => voterTypes.includes(poll.population));
    });

    updateTotals(data);

    if (event?.srcElement?.name === 'voters') {
        const pollsterData = JSON.parse(JSON.stringify(allData));
        pollsterData.forEach(state => {
            state.polls = state.polls.filter(poll => voterTypes.includes(poll.population))
        });
        updatePollstersCount(pollsterData);
    }

    const transformedData = await transform538Data(data);
    updateDataTable(transformedData);
    if (includeTableMetaData) {
        updateDataTableMetaData(data);
    }

    updateResultsBar(transformedData);

    // roll-up states with districts
    const rolledUpData = JSON.parse(JSON.stringify(transformedData));
    const districts = rolledUpData.filter(state => /.* DIST. \d{1}/.test(state.ucName));
    districts.forEach(district => {
        const stateName = district.ucName.replace(/ DIST. \d{1}/, '');
        const state = rolledUpData.find(state => state.ucName === stateName);
        state.custom.elVotesDem += district.custom.elVotesDem;
        state.custom.elVotesRep += district.custom.elVotesRep;
        const stateVotesDem = state.custom.votesDem * state.custom.sample_size / 100;
        const districtVotesDem = district.custom.votesDem * district.custom.sample_size / 100;
        state.votesDem = (stateVotesDem + districtVotesDem) * 100 / (state.custom.sample_size + district.custom.sample_size);
        const stateVotesRep = state.custom.votesRep * state.custom.sample_size / 100;
        const districtVotesRep = district.custom.votesRep * district.custom.sample_size / 100;
        state.votesRep = (stateVotesRep + districtVotesRep) * 100 / (state.custom.sample_size + district.custom.sample_size);
        state.custom.state_votes += district.custom.state_votes;
        const idx = rolledUpData.indexOf(district);
        rolledUpData.splice(idx, 1);
    });
    initChart(rolledUpData);
}

async function updateAllPolls() {
    const allPolls = document.getElementById("pollster-all");
    for (let idx = 0; idx < numPollsters; ++idx) {
        const pollster = document.getElementById(`pollster-${idx}`);
        pollster.checked = allPolls.checked;
    }
    update();
}

async function updateVoters(data) {
    const populations = data.map(state => state.polls).flat().map(poll => { return { population: poll.population, sampleSize: parseInt(poll.sampleSize) } }).flat();
    const populationCounts = populations.reduce((p, c) => {
        let value = p.get(c.population);
        if (value === undefined) {
            value = 0;
        }
        value += parseInt(c.sampleSize);
        return p.set(c.population, value);
    }, new Map());

    const adultVoters = populationCounts.get('a') ? populationCounts.get('a').toLocaleString() : 0;
    const adult = document.getElementById(`adult-label`);
    adult.innerText = ` Adult (${adultVoters})`;
    const voters = populationCounts.get('v') ? populationCounts.get('v').toLocaleString() : 0;
    const voter = document.getElementById(`voter-label`);
    voter.innerText = ` Voter (${voters})`;
    const registeredVoters = populationCounts.get('rv') ? populationCounts.get('rv').toLocaleString() : 0;
    const registered = document.getElementById(`registered-label`);
    registered.innerText = ` Registered (${registeredVoters})`;
    const likelyVoters = populationCounts.get('lv') ? populationCounts.get('lv').toLocaleString() : 0;
    const likely = document.getElementById(`likely-label`);
    likely.innerText = ` Likely (${likelyVoters})`;
}

async function updatePollstersCount(data) {
    const allPollsters = data.map(state => state.polls).flat().map(poll => poll.pollster);
    const pollsterCounts = allPollsters.reduce((p, c) => {
        let value = p.get(c);
        if (value === undefined) {
            value = 0;
        }
        value++;
        return p.set(c, value);
    }, new Map());

    const pollstersDiv = document.getElementById('pollsters').children;
    Array.from(pollstersDiv).forEach(div => {
        const labels = Array.from(div.children).filter(child => child.nodeName === 'LABEL');
        labels.forEach(label => {
            label.innerText = ` ${label.for} (0)`;
        });
    });

    const pollsters = Array.from(pollsterCounts.entries());

    pollsters.forEach(pollster => {
        const label = document.getElementById(`${pollster[0]}-label`);
        label.innerText = ` ${pollster[0]} (${pollster[1].toLocaleString()})`;
    });
}

async function updateTotals(data) {
    const populations = data.map(state => state.polls).flat().map(poll => { return { population: poll.population, sampleSize: parseInt(poll.sampleSize) } }).flat();
    const populationCounts = populations.reduce((p, c) => {
        let value = p.get(c.population);
        if (value === undefined) {
            value = 0;
        }
        value += parseInt(c.sampleSize);
        return p.set(c.population, value);
    }, new Map());
    const totalVoters = Array.from(populationCounts.values()).reduce((partialSum, a) => partialSum + a, 0);
    const votersTitle = document.getElementById('voters-title');
    votersTitle.innerText = `Voters (${totalVoters.toLocaleString()})`;

    const allPollsters = data.map(state => state.polls).flat().map(poll => poll.pollster);
    const pollsterCounts = allPollsters.reduce((p, c) => {
        let value = p.get(c);
        if (value === undefined) {
            value = 0;
        }
        value++;
        return p.set(c, value);
    }, new Map());
    const totalPolls = pollsterCounts.values().reduce((partialSum, a) => partialSum + a, 0);
    const pollsTitle = document.getElementById('polls-title');
    pollsTitle.innerText = `Polls (${totalPolls.toLocaleString()})`;
}

const MAX_POLLSTERS = -1;

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
        input.name = 'pollsters';
        input.value = item[0];
        input.checked = true;
        input.onclick = update;
        div.appendChild(input);
        const label = document.createElement('label');
        label.id = `${item[0]}-label`;
        label.for = item[0];
        label.innerText = ` ${item[0]} (${item[1].toLocaleString()})`;
        div.appendChild(label);
        pollstersDiv.appendChild(div);
    });
}

async function initDateSlider(data) {
    const dates = data.map(state => state.polls).flat().map(poll => poll.endDate).map(date => Date.parse(date)).filter(date => date !== undefined).flat();//.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const timeLineTitle = document.getElementById('time-line-title');
    timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;

    $("#time-line").slider({
        range: true,
        min: minDate.getTime() / 1000,
        max: maxDate.getTime() / 1000,
        step: 86400,
        values: [minDate.getTime() / 1000, maxDate.getTime() / 1000],
        slide: function (event, ui) {
            const minDate = new Date(ui.values[0] * 1000);
            const maxDate = new Date(ui.values[1] * 1000);
            const timeLineTitle = document.getElementById('time-line-title');
            timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;
            update(null, false, minDate, maxDate);
        },
        stop: function (event, ui) {
            const minDate = new Date(ui.values[0] * 1000);
            const maxDate = new Date(ui.values[1] * 1000);
            const timeLineTitle = document.getElementById('time-line-title');
            timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;
            update(null, true, minDate, maxDate);
        }
    });
}

(async () => {
    allData = await load538Data();
    updateVoters(allData);
    addPollsters(allData);
    initDateSlider(allData);
    update(undefined, true);

    // animation
    // let min = 1719756000000;
    // const max = 1723989600000;
    // let timerId = setInterval(function() {
    //     if (min <= (max-(86400000*7))) {
    //         const minDate = new Date(min);
    //         const maxDate = new Date(max);
    //         $("#time-line").slider({
    //             values: [minDate.getTime() / 1000, maxDate.getTime() / 1000],
    //         });
    //         const timeLineTitle = document.getElementById('time-line-title');
    //         timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;
    //         update(null, true, minDate, maxDate);
    //         min += 86400000;
    //     }
    // }, 500);
    // setTimeout(() => { if (min >= (max-(86400000*7))) { clearInterval(timerId); }}, 500);
})();
