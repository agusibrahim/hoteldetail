const DDG = require('duck-duck-scrape')
const axios = require('axios')
const fs = require('fs')
const stringSimilarity = require("string-similarity");

const { Router, query } = require('express');
const { SuccessResponseObject } = require('../common/http');

const r = Router();

r.get('/', (async (req, res) => {
    var hotelname = req.query.hotel
    var addr = req.query.addr
    var city = req.query.city
    var prov = "tiket.com"
    if (req.query.provider === 'tiket') {
        prov = "tiket.com"
    } else if (req.query.provider === 'agoda') {
        prov = "www.agoda.com"
    } else if (req.query.provider === 'traveloka') {
        prov = "traveloka.com"
    } else if (req.query.provider === 'trip') {
        prov = "trip.com"
    }
    const searchResults = await DDG.search('site:' + prov + ' ' + hotelname + ' ' + addr + ' ' + city, {
        safeSearch: DDG.SafeSearchType.STRICT
    })
    var results = searchResults["results"]
    console.log(results)
    if (results.length > 0) {
        console.log("getting " + results[0].url.replace("www.", "id."))
        if (req.query.provider === 'trip') {
            axios.get(results[0].url.replace("www.", "id."), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36'
                }
            }).then(r => {
                if (`${r.data}`.search("hotelBaseData") > 100) {
                    var jj = JSON.parse((`${r.data}`.split("window.IBU_HOTEL =")[1].split("__webpack_public_path__=")[0]).trim())

                    var mydata = { "hotelBaseData": jj["initData"]["hotelBaseData"], "hotelFacilityPop": jj["initData"]["hotelFacilityPop"], "staticHotelInfo": jj["initData"]["staticHotelInfo"] }
                    var reshotelname = (mydata["hotelBaseData"]["baseInfo"]["hotelName"] + "").toLocaleLowerCase()
                    var d = { "searchdata": { "query": hotelname.toLocaleLowerCase(), "result": reshotelname, "match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(), reshotelname.toLocaleLowerCase()) }, "hotel": mydata }
                    //console.log(JSON.stringify(d))
                    res.json(new SuccessResponseObject('berhasil mendapatkan data', d));
                } else {
                    res.json(new SuccessResponseObject('no result', {}));
                }
                //console.log(r.data)
            })
        }
        else if (req.query.provider === 'agoda') {
            axios({
                "method": "POST",
                "url": "https://www.agoda.com/api/gw/property/getProperty",
                "headers": {
                    "Accept-Language": "id-id",
                    "Content-Type": "application/json",
                },
                "data": {
                    "url": "/" + results[0].url.split("agoda.com/")[1].split(".html")[0] + ".html"
                }
            }).then(r => {
                // if(`${r.data}`.search("hotelBaseData")>100){
                //     var jj=JSON.parse( (`${r.data}`.split("window.IBU_HOTEL =")[1].split("__webpack_public_path__=")[0]).trim() )

                //     var mydata={"hotelBaseData": jj["initData"]["hotelBaseData"],"hotelFacilityPop": jj["initData"]["hotelFacilityPop"],"staticHotelInfo": jj["initData"]["staticHotelInfo"]}
                //     var reshotelname=(mydata["hotelBaseData"]["baseInfo"]["hotelName"]+"").toLocaleLowerCase()
                //     var d={"searchdata": {"query": hotelname.toLocaleLowerCase(),"result": reshotelname,"match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(),reshotelname.toLocaleLowerCase() )}, "hotel": mydata}
                //     console.log(JSON.stringify(d))
                // }
                var reshotelname = r.data.summary.propertyName.displayName;
                var d = { "searchdata": { "query": hotelname.toLocaleLowerCase(), "result": reshotelname, "match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(), reshotelname.toLocaleLowerCase()) }, "hotel": r.data };
                res.json(new SuccessResponseObject('berhasil mendapatkan data', d));
            }).catch(r => {
                res.json(new SuccessResponseObject('no result', {}));
            })
        } else if (req.query.provider === 'tiket') {
            console.log("getting tiket detail hotel: -" + results[0].url + "-");
            axios({
                "method": "GET",
                "url": results[0].url,
                "headers": {
                    "Accept-Language": "id-id",
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36'
                }
            }).then(r => {
                //fs.writeFileSync("/Users/agussulkhi/Downloads/wapi2/hoteldetail/hotelout.html", r.data + "")
                // if(`${r.data}`.search("hotelBaseData")>100){
                //     var jj=JSON.parse( (`${r.data}`.split("window.IBU_HOTEL =")[1].split("__webpack_public_path__=")[0]).trim() )

                //     var mydata={"hotelBaseData": jj["initData"]["hotelBaseData"],"hotelFacilityPop": jj["initData"]["hotelFacilityPop"],"staticHotelInfo": jj["initData"]["staticHotelInfo"]}
                //     var reshotelname=(mydata["hotelBaseData"]["baseInfo"]["hotelName"]+"").toLocaleLowerCase()
                //     var d={"searchdata": {"query": hotelname.toLocaleLowerCase(),"result": reshotelname,"match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(),reshotelname.toLocaleLowerCase() )}, "hotel": mydata}
                //     console.log(JSON.stringify(d))
                // }
                var dd = JSON.parse(r.data.split("__NEXT_DATA__\" type=\"application/json\">")[1].split("</script>")[0])
                var reshotelname = dd.props.pageProps.hotelDetailData.name
                var d = { "searchdata": { "query": hotelname.toLocaleLowerCase(), "result": reshotelname, "match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(), reshotelname.toLocaleLowerCase()) }, "hotel": dd };
                res.json(new SuccessResponseObject('berhasil mendapatkan data', d));
            }).catch(r => {
                //fs.writeFileSync("/Users/agussulkhi/Downloads/wapi2/hoteldetail/hotelout.html", "error: "+r)
                res.json(new SuccessResponseObject('no result', {}));
            })
            //res.json(new SuccessResponseObject('results: '+results[0].url, {}));
        } else if (req.query.provider === 'traveloka') {
            console.log("getting traveloka detail hotel: -" + results[0].url + "-");
            axios({
                "method": "GET",
                "url": results[0].url,
                "headers": {
                    "Accept-Language": "id-id",
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36'
                }
            }).then(r => {
                //fs.writeFileSync("/Users/agussulkhi/Downloads/wapi2/hoteldetail/hotelout.html", r.data+"")
                // if(`${r.data}`.search("hotelBaseData")>100){
                //     var jj=JSON.parse( (`${r.data}`.split("window.IBU_HOTEL =")[1].split("__webpack_public_path__=")[0]).trim() )

                //     var mydata={"hotelBaseData": jj["initData"]["hotelBaseData"],"hotelFacilityPop": jj["initData"]["hotelFacilityPop"],"staticHotelInfo": jj["initData"]["staticHotelInfo"]}
                //     var reshotelname=(mydata["hotelBaseData"]["baseInfo"]["hotelName"]+"").toLocaleLowerCase()
                //     var d={"searchdata": {"query": hotelname.toLocaleLowerCase(),"result": reshotelname,"match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(),reshotelname.toLocaleLowerCase() )}, "hotel": mydata}
                //     console.log(JSON.stringify(d))
                // }
                var dd = JSON.parse(r.data.split("window.staticProps = ")[1].split(";\n")[0])
                var reshotelname = dd.hotelDetailData.name
                var d = { "searchdata": { "query": hotelname.toLocaleLowerCase(), "result": reshotelname, "match": stringSimilarity.compareTwoStrings(hotelname.toLocaleLowerCase(), reshotelname.toLocaleLowerCase()) }, "hotel": dd.hotelDetailData };
                res.json(new SuccessResponseObject('berhasil mendapatkan data', d));
            }).catch(r => {
                //fs.writeFileSync("/Users/agussulkhi/Downloads/wapi2/hoteldetail/hotelout.html", "error: " + r)
                res.json(new SuccessResponseObject('no result', {}));
            })
            //res.json(new SuccessResponseObject('results: '+results[0].url, {}));
        } else {
            res.json(new SuccessResponseObject('plz set provider', {}));
        }
    } else {
        res.json(new SuccessResponseObject('no result', {}));
    }

}))

module.exports = r;