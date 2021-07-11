import { BingoTentativeNotification, ParseTimespan } from '../EBS/BingoService/EBSBingoTypes';

test("Properly converts BingoTentativeNotification", () => {
    const jsonNotification = '{"gameId":"b9eae15e-065d-4adc-aa1d-d1c39d98126f","key":3,"tentativeTime":"2021-07-11T12:50:50.4921163Z"}';
    const parsedBingoTentativeNotification = JSON.parse(jsonNotification, (key, value) => {
        if (key == "tentativeTime")
        {
            return new Date(value);
        }
        return value;
    });
    expect(parsedBingoTentativeNotification).not.toBeNull();
    expect(parsedBingoTentativeNotification.gameId).toBeDefined();
    expect(parsedBingoTentativeNotification.key).toBeDefined();
    expect(parsedBingoTentativeNotification.tentativeTime).toBeInstanceOf(Date);
    const bingoTentativeNotification = parsedBingoTentativeNotification as BingoTentativeNotification;
    expect(bingoTentativeNotification).not.toBeNull();
    expect(bingoTentativeNotification.tentativeTime).toBeDefined();
    expect(bingoTentativeNotification.tentativeTime).toBeInstanceOf(Date);
    expect(bingoTentativeNotification.tentativeTime.getTime()).toBe(new Date("2021-07-11T12:50:50.4921163Z").getTime());
});

test("Can parse timespan properly", () => {
    var parsedPeriod = ParseTimespan("00:02:00")
    expect(parsedPeriod).toBe(120000)
    var parsedPeriod = ParseTimespan("00:02:00.4921163")
    expect(parsedPeriod).toBeCloseTo(120492.1163)
    var parsedPeriod = ParseTimespan("00:00:01.4921163")
    expect(parsedPeriod).toBeCloseTo(1492.1163)
    var parsedPeriod = ParseTimespan("00:02:01.4921163")
    expect(parsedPeriod).toBeCloseTo(121492.1163)
    var parsedPeriod = ParseTimespan("1.01:02:01.4921163")
    expect(parsedPeriod).toBeCloseTo(90121492.1163)
    var parsedPeriod = ParseTimespan("-00:02:01.4921163")
    expect(parsedPeriod).toBeCloseTo(-121492.1163)
    var parsedPeriod = ParseTimespan("-1.01:02:01.4921163")
    expect(parsedPeriod).toBeCloseTo(-90121492.1163)
});