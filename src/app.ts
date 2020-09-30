import { links, event, crawl } from "./crawl";

const base_url = process.argv[2] || "https://www.thinkovi.com/";

if (!base_url) {
  throw new Error("Please provide a start url");
}

links[base_url] = {
  count: 0,
  error: 0,
  crawled: false,
};

let start_url = Object.keys(links)[0];

event.on("crawl", function (link) {
  if (link in links && (links[link]["processing"] || links[link]["crawled"])) {
    return;
  }

  links[link]["processing"] = true;

  console.log(`Crawling ${link}`);

  crawl(base_url, link)
    .finally(function () {
      console.log("DONE " + link, Object.keys(links).length);
    })
    .catch(function (error) {
      throw new Error(error);
    });
});

event.emit("crawl", start_url);

let timeout = function (): void {
  setTimeout(function () {
    let val: number[] = Object.keys(links).map(function (key) {
      if (!links[key].crawled) {
        return 1;
      }
      return 0;
    });

    let queue = val.reduceRight(function (a, b) {
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
