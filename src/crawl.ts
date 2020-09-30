import axios, { AxiosError, AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { EventEmitter } from "events";
import fs from "fs";

let event = new EventEmitter();

type Links = {
  [id: string]: {
    count: number;
    error: string | undefined | number;
    crawled?: boolean;
    processing?: boolean;
    stored?: boolean;
  };
};

let links: Links = {};

function crawl(
  base_url: string,
  start_url: string
): Promise<AxiosResponse | void> {
  const domain_name = new URL(base_url)["hostname"];
  const csv_file = "var/" + domain_name + ".csv";

  if (!(start_url in links)) {
    links[start_url] = {
      count: 1,
      error: "",
      crawled: false,
    };
  }

  links[start_url]["processing"] = true;

  return axios
    .get(start_url)
    .then(function (response: AxiosResponse) {
      const $ = cheerio.load(response.data);

      links[start_url]["processing"] = false;
      if (
        !links[start_url]["stored"] &&
        response.headers["content-type"].includes("text/html")
      ) {
        fs.appendFileSync(csv_file, start_url + ";" + $("title").text() + "\n");
      }

      links[start_url]["stored"] = true;

      $("body")
        .find("a")
        .each(function (index, elem) {
          let link: string | undefined = $(elem).attr("href");
          index;

          link = sanitizeUrl(link).split("#")[0];

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
    .catch(function (reason: AxiosError) {
      links[start_url] = {
        error: reason.code,
        count: 1,
        crawled: true,
        processing: false,
      };

      if (!links[start_url]["stored"]) {
        fs.appendFileSync(
          csv_file,
          start_url + ";ERROR: " + reason.message + "\n"
        );
      }

      links[start_url]["stored"] = true;
    });
}

export { links, event, crawl };
