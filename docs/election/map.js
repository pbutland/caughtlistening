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
