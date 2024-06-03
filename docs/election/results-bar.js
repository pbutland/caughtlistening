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

async function updateResultsBar(data) {
    // Sum electoral college votes
    const demVotes = data.filter(item => item.ucName !== 'NATIONAL').reduce((partialSum, a) => partialSum + a.custom.elVotesDem, 0);
    const repVotes = data.filter(item => item.ucName !== 'NATIONAL').reduce((partialSum, a) => partialSum + a.custom.elVotesRep, 0);

    let element = document.getElementById('info-dem1');
    element.innerHTML = `Biden: ${demVotes}`;

    element = document.getElementById('info-rep1');
    element.innerHTML = `Trump: ${repVotes}`;

    // create histogram for electoral college votes
    const min = 0;
    const binRange = 2;
    const numberOfBins = 10;
    const demBins = new Array(numberOfBins);
    const repBins = new Array(numberOfBins);

    // Add values to histogram
    data.forEach((item, index) => {
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
