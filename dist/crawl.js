"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawl = exports.event = exports.links = void 0;
var axios_1 = __importDefault(require("axios"));
var cheerio = __importStar(require("cheerio"));
var sanitize_url_1 = require("@braintree/sanitize-url");
var events_1 = require("events");
var fs_1 = __importDefault(require("fs"));
var event = new events_1.EventEmitter();
exports.event = event;
var links = {};
exports.links = links;
function crawl(base_url, start_url) {
    var domain_name = new URL(base_url)["hostname"];
    var csv_file = "var/" + domain_name + ".csv";
    if (!(start_url in links)) {
        links[start_url] = {
            count: 1,
            error: "",
            crawled: false,
        };
    }
    links[start_url]["processing"] = true;
    return axios_1.default
        .get(start_url)
        .then(function (response) {
        var $ = cheerio.load(response.data);
        links[start_url]["processing"] = false;
        if (!links[start_url]["stored"] &&
            response.headers["content-type"].includes("text/html")) {
            fs_1.default.appendFileSync(csv_file, start_url + ";" + $("title").text() + "\n");
        }
        links[start_url]["stored"] = true;
        $("body")
            .find("a")
            .each(function (index, elem) {
            var link = $(elem).attr("href");
            index;
            link = sanitize_url_1.sanitizeUrl(link).split("#")[0];
            if (link != undefined && link.substr(0, 4) != "http") {
                link = base_url + link;
            }
            if (link === undefined || !link.includes(base_url)) {
                return;
            }
            if (!(link in links)) {
                links[link] = {
                    count: 1,
                    error: "",
                };
            }
            event.emit("crawl", link);
            links[link]["count"] += 1;
            return elem;
        });
        return Promise.resolve(response);
    })
        .finally(function () {
        links[start_url]["crawled"] = true;
        links[start_url]["processing"] = false;
    })
        .catch(function (reason) {
        links[start_url] = {
            error: reason.code,
            count: 1,
            crawled: true,
            processing: false,
        };
        if (!links[start_url]["stored"]) {
            fs_1.default.appendFileSync(csv_file, start_url + ";ERROR: " + reason.message + "\n");
        }
        links[start_url]["stored"] = true;
    });
}
exports.crawl = crawl;
//# sourceMappingURL=crawl.js.map