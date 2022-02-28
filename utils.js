function minutesToString(minutes, showSign) {
    let sign = Math.sign(minutes);

    minutes = Math.abs(minutes);

    let duration = moment.duration(minutes, 'minutes');
    let minutesString = (duration.days() * 24) + duration.hours() + ':' + duration.minutes().toString().padStart(2, '0');

    //console.log('format minutes: ' + minutes + ' -> ' + minutesString);

    if (sign < 0) {
        minutesString = "-" + minutesString;
    }
    else if (showSign) {
        minutesString = "+" + minutesString;
    }
    return minutesString;

    //return (Math.round(minutes / 60 * 100) / 100) + "h";
}

function numberToIndex(num, length) {
    if (!num) {
        return 0;
    }
    return num % length;
}