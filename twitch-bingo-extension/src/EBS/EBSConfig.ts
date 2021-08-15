var server = "https://twitchext.conceptoire.com/bingo/v1"

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('state') == "testing")
{
    server = "https://twitchext-aws-test.conceptoire.com"
}


export const EBSVersion = "0.0.1";
export const EBSBaseUrl = server;