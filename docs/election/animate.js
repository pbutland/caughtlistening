let animateMinDate;
let animateMaxDate;
let timerId;

function blah() {
    const animate = document.getElementById("animate");

    if (animate.checked) {
        let min = animateMinDate;
        const max = animateMaxDate;
        timerId = setInterval(function() {
            if (min <= (max-(86400000*7))) {
                const minDate = new Date(min);
                const maxDate = new Date(max);
                $("#time-line").slider({
                    values: [minDate.getTime() / 1000, maxDate.getTime() / 1000],
                });
                const timeLineTitle = document.getElementById('time-line-title');
                timeLineTitle.innerText = `Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})`;
                update(null, true, minDate, maxDate);
                min += 86400000;
            }
        }, 1000);
        setTimeout(() => { if (min >= (max-(86400000*7))) { clearInterval(timerId); }}, 1000);
    } else {
        clearInterval(timerId);
    }
}