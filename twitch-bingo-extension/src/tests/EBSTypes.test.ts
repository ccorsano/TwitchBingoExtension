import { BingoTentativeNotification } from '../EBS/BingoService/EBSBingoTypes';

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