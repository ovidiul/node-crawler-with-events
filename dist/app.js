"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crawl_1 = require("./crawl");
var base_url = process.argv[2] || "https://www.thinkovi.com/";
if (!base_url) {
    throw new Error("Please provide a start url");
}
crawl_1.links[base_url] = {
    count: 0,
    error: 0,
    crawled: false,
};
var start_url = Object.keys(crawl_1.links)[0];
crawl_1.event.on("crawl", function (link) {
    if (link in crawl_1.links && (crawl_1.links[link]["processing"] || crawl_1.links[link]["crawled"])) {
        return;
    }
    crawl_1.links[link]["processing"] = true;
    console.log("Crawling " + link);
    crawl_1.crawl(base_url, link)
        .finally(function () {
        console.log("DONE " + link, Object.keys(crawl_1.links).length);
    })
        .catch(function (error) {
        throw new Error(error);
    });
});
crawl_1.event.emit("crawl", start_url);
var timeout = function () {
    setTimeout(function () {
        var val = Object.keys(crawl_1.links).map(function (key) {
            if (!crawl_1.links[key].crawled) {
                return 1;
            }
            return 0;
        });
        var queue = val.reduceRight(function (a, b) {
            return a + b;
        });
        console.log("EVENTS: " + queue);
        if (!queue) {
            process.exit();
        }
        timeout();
    }, 10000);
};
timeout();
//# sourceMappingURL=app.js.map