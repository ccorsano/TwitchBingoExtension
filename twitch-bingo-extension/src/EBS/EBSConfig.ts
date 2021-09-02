var server = "https://bingo-ebs.conceptoire.com"

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('state') == "testing")
{
    server = "https://localhost:5001"
}


export const EBSVersion = "0.0.1";
export const EBSBaseUrl = server;
