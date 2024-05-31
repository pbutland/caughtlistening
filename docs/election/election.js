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
    let nationalDemVotes = 0;
    let nationalRepVotes = 0;
    let nationalDemElVotes = 0;
    let nationalRepElVotes = 0;
    let nationalTotalVotes = 0;
    const transformed = data.map(state => {
        // Aggregate votes from all polls
        const demVotes = state.polls.reduce((partialSum, a) => partialSum + (parseInt(a.answers.find(i => i.party === 'Dem').pct) / 100) * a.sampleSize, 0);
        const repVotes = state.polls.reduce((partialSum, a) => partialSum + (parseInt(a.answers.find(i => i.party === 'Rep').pct) / 100) * a.sampleSize, 0);
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

        return {
            ucName: state.ucName,
            value: diff.toFixed(2),
            custom: {
                winner: diff > 0 ? 'Republican' : 'Democrat',
                elVotesDem: demElVotes,
                elVotesRep: repElVotes,
                votesDem: demPct.toFixed(2),
                votesRep: repPct.toFixed(2),
                state_votes: state.state_votes,
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
const MAX_POLLSTERS = -1;

async function update(event, minDate, maxDate, includeTableMetaData) {
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
            state.polls = state.polls.filter(poll => Date.parse(poll.endDate) > minDate && Date.parse(poll.endDate) < maxDate)
        });
    }

    data.forEach(state => {
        state.polls = state.polls.filter(poll => pollsters.includes(poll.pollster))
    });

    updateVoters(data);

    data.forEach(state => {
        state.polls = state.polls.filter(poll => voterTypes.includes(poll.population))
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
    initChart(transformedData);
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
        value += c.sampleSize;
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
        value += c.sampleSize;
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

async function addPolls(stateName, polls) {
    if (polls.length === 0) {
        return;
    }

    const uniquePolls = polls.reduce((p, c) => {
        let value = p.get(c.pollster);
        if (value === undefined) {
            value = {
                url: c.url,
                count: 0
            };
        }
        value.count++;
        return p.set(c.pollster, value);
    }, new Map());
    const sortedPolls = new Map([...uniquePolls.entries()].sort((a, b) => b[1].count - a[1].count));

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const list = document.createElement('ul');

    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'poll-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Eo_circle_teal_letter-p.svg';
    const div = document.createElement('div');
    div.className = 'poll-tooltip';
    span.onmouseenter = (() => {
        div.hidden = false;
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    const totalNumPolls = Array.from(uniquePolls).reduce((partialSum, a) => partialSum + a[1].count, 0);
    div.innerText = `Polls: (${totalNumPolls.toLocaleString()})`;
    div.appendChild(list);
    Array.from(sortedPolls).forEach(poll => {
        const listItem = document.createElement('li');
        list.appendChild(listItem);
        if (poll[1].url) {
            const anchor = document.createElement('a');
            anchor.href = poll[1].url;
            anchor.innerText = poll[0];
            listItem.appendChild(anchor);
            const count = document.createElement('span');
            count.innerText = ` (${poll[1].count.toLocaleString()})`;
            listItem.appendChild(count);
        } else {
            listItem.innerText = `${poll[0]} (${poll[1].count.toLocaleString()})`;
        }
    });
    cell.appendChild(span);
}

async function addSponsors(stateName, sponsors) {
    const uniqueSponsors = [...new Map(sponsors.map(item => [item['sponsor'], item])).values()];
    if (uniqueSponsors.length === 0) {
        return;
    }

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const list = document.createElement('ul');

    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'sponsor-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Eo_circle_indigo_letter-s.svg';
    const div = document.createElement('div');
    div.className = 'sponsor-tooltip';
    span.onmouseenter = (() => {
        div.hidden = false;
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    div.innerText = "Poll sponsors:";
    div.appendChild(list);
    uniqueSponsors.forEach(sponsor => {
        const listItem = document.createElement('li');
        list.appendChild(listItem);
        if (sponsor.url) {
            const anchor = document.createElement('a');
            anchor.href = sponsor.url;
            anchor.innerText = sponsor.sponsor;
            listItem.appendChild(anchor);
        } else {
            listItem.innerText = sponsor.sponsor;
        }
    });
    cell.appendChild(span);
}

async function addVoters(stateName, polls) {
    if (polls.length === 0) {
        return;
    }

    const populations = polls.map(poll => { return { population: poll.population, sampleSize: parseInt(poll.sampleSize) } }).flat();
    const populationCounts = populations.reduce((p, c) => {
        let value = p.get(c.population);
        if (value === undefined) {
            value = 0;
        }
        value += c.sampleSize;
        return p.set(c.population, value);
    }, new Map());

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const list = document.createElement('ul');

    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'voter-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Eo_circle_deep-orange_letter-v.svg';
    const div = document.createElement('div');
    div.className = 'voter-tooltip';
    span.onmouseenter = (() => {
        div.hidden = false;
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    const totalNumVoters = Array.from(populationCounts).reduce((partialSum, a) => partialSum + a[1], 0);
    div.innerText = `Voters: (${totalNumVoters.toLocaleString()})`;
    div.appendChild(list);

    const types = [{ name: 'Adult', key: 'a', }, { name: 'Voter', key: 'v' }, { name: 'Registered', key: 'rv' }, { name: 'Likely', key: 'lv' }];
    types.forEach(type => {
        const listItem = document.createElement('li');
        list.appendChild(listItem);
        listItem.innerText = `${type.name}: ${populationCounts.get(type.key)?.toLocaleString() || 0}`;
    });
    cell.appendChild(span);
}

async function showChart(stateName, polls) {
    const uniquePolls = [...new Map(polls.map(poll => [poll.endDate, poll])).values()]

    const demData = uniquePolls.map(poll => {
        return {
            x: new Date(Date.parse(poll.endDate)),
            y: parseInt(poll.answers.find(a => a.party === 'Dem')?.pct),
        }
    }).sort((lhs, rhs) => rhs.x.getTime() - lhs.x.getTime());

    const repData = uniquePolls.map(poll => {
        return {
            x: new Date(Date.parse(poll.endDate)),
            y: parseInt(poll.answers.find(a => a.party === 'Rep')?.pct),
        }
    }).sort((lhs, rhs) => rhs.x.getTime() - lhs.x.getTime());

    Highcharts.chart(`${stateName}-map-container`, {
        chart: {
            type: 'spline'
        },
        title: {
            text: `${stateName}`,
            align: 'center'
        },
        yAxis: {
            title: {
                text: 'Votes (%)'
            }
        },
        xAxis: {
            type: 'datetime',
            accessibility: {
                rangeDescription: 'Date'
            }
        },
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
        },
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                }
            }
        },
        colors: ['#0913df', '#df1309'],
        series: [{
            name: 'Democrat',
            data: demData
        }, {
            name: 'Republican',
            data: repData
        }]
    });
}

async function addTrend(stateName, polls) {
    if (polls.length === 0) {
        return;
    }

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const container = document.createElement('div');
    container.id = `${stateName}-map-container`;
    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'trend-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/5/50/Eo_circle_amber_letter-t.svg';
    const div = document.createElement('div');
    div.className = 'trend-tooltip';
    span.onmouseenter = (() => {
        div.hidden = false;
        showChart(stateName, polls);
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    div.appendChild(container);
    cell.appendChild(span);
}

async function updateDataTableMetaData(data) {
    data.forEach(state => {
        addPolls(state.ucName, state.polls);
        addSponsors(state.ucName, state.polls.map(poll => poll.sponsors).flat().filter(sponsors => sponsors !== undefined)); // sponsors
        addVoters(state.ucName, state.polls);
        addTrend(state.ucName, state.polls);
    });
}

async function updateDataTable(data) {
    // Sum electoral college votes
    const demVotes = data.filter(item => item.ucName !== 'NATIONAL').reduce((partialSum, a) => partialSum + a.custom.elVotesDem, 0);
    const repVotes = data.filter(item => item.ucName !== 'NATIONAL').reduce((partialSum, a) => partialSum + a.custom.elVotesRep, 0);

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
        state.id = `table-${item.ucName}`;
        state.className = 'datagrid-cell';
        const democrat = newRow.insertCell(1);
        democrat.className = 'datagrid-cell';
        const republican = newRow.insertCell(2);
        republican.className = 'datagrid-cell';
        const demVotes = newRow.insertCell(3);
        demVotes.className = 'datagrid-cell';
        const repVotes = newRow.insertCell(4);
        repVotes.className = 'datagrid-cell';
        state.innerText = item.ucName;
        democrat.innerText = isNaN(item.custom.votesDem) ? '-' : item.custom.elVotesDem;
        republican.innerText = isNaN(item.custom.votesDem) ? '-' : item.custom.elVotesRep;
        demVotes.innerText = isNaN(item.custom.votesDem) ? '-' : `${item.custom.votesDem}%`;
        repVotes.innerText = isNaN(item.custom.votesRep) ? '-' : `${item.custom.votesRep}%`;

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
        div.style.background = '#ccc';
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
        step: 604800,
        values: [minDate.getTime() / 1000, maxDate.getTime() / 1000],
        slide: function (event, ui) {
            const minDate = new Date(ui.values[0] * 1000);
            const maxDate = new Date(ui.values[1] * 1000);
            const timeLineTitle = document.getElementById('time-line-title');
            timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;
            update(null, minDate, maxDate);
        },
        stop: function (event, ui) {
            const minDate = new Date(ui.values[0] * 1000);
            const maxDate = new Date(ui.values[1] * 1000);
            const timeLineTitle = document.getElementById('time-line-title');
            timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;
            update(null, minDate, maxDate, true);
        }
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
            text: '',
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
        legend: {
            symbolWidth: 300
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
    initDateSlider(allData);
    update(undefined, undefined, undefined, true);
})();
