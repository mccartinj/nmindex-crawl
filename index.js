
import Crawler from "crawler";
import isValidUrl from './helpers/isValidUrl.js';
import isUrlAbsolute from './helpers/isUrlAbsolute.js';
import nmGalaxyHosts from './helpers/nmGalaxyHosts.json' assert { type: 'json' };
import {getLinks, getLinksNotCrawled, getGalaxyLinksNotCrawled, getTargetedLinksNotCrawled, saveLink, setToCrawled, setToInvalid, setBatchToInvalid, savePage} from './pgdb.js';




( async () => {

  let links_db = [];

  const pullAndCleanLinks = async () => {
    console.log('pullAndCleanLinks');
    //get a list of all links in the database and flatten it into an array
    links_db = []; // reset the links_db var so that it's synced with the db and not the in-program memory
    let links_res = await getLinks();
    for(let i = 0; i<links_res.length; i++) {
      let url = links_res[i].link_url;
      links_db.push(url)
    }

    //get a list of the next 100 links not yet crawled in the database and flatten it into an array
    let linksNotCrawled_res = await getGalaxyLinksNotCrawled();
    let linksNotCrawled_db = [];
    for(let i = 0; i<linksNotCrawled_res.length; i++) {
      let url = linksNotCrawled_res[i].link_url;
      linksNotCrawled_db.push(url)
    }

    //remove from crawling any files, in-page anchors, or query urls (hopefully we can resolve this later?).
    //put any bad urls in an array to mark them as invalid in the db
    const blacklist = ['#','?','.pdf','.epub','.jpg','.jpeg','.png','mailto:','.mp4','.m4a','mp3','.wav'];

    let badLinks = linksNotCrawled_db.filter(
      u => blacklist.every( s => u.includes(s) )
    )

    badLinks.map((url)=>{
      setToInvalid(url);
    })

    let goodLinks = linksNotCrawled_db.filter(
      u => blacklist.every( s => !u.includes(s) )
    )

    return goodLinks;

  }


  const c = new Crawler({
      maxConnections: 1,

      callback: async (error, res, done) => {
          if (error) {
              console.log(error);
          } else {
              const $ = res.$;
              let uri = res.options.uri;
              let domain = new URL(res.options.uri).hostname;

              if(typeof $ != "function"){
                done();
                return false;
              }

              let bodyText = $('body').text().trim();
              let title = $('title').text();
              let description = $('meta[name="description"]').attr('content');


              let payload = {
                url: uri,
                domain: domain,
                title: title,
                description: description,
                bodyText: JSON.stringify(bodyText)
              }
              savePage(payload);

              // grab all the anchor tags and add the good ones into the db
              let $anchors = $('a');
              $anchors.each(async (i,elem) => {
                let href = $(elem).attr('href');

                //deal with relative urls
                if(href && !isUrlAbsolute(href)) {
                  let baseEdit = domain;
                  let lastBaseChar = baseEdit.charAt(baseEdit.length-1);
                  if(lastBaseChar == '/') {
                    baseEdit = baseEdit.substring(0,baseEdit.length-1)
                  }
                  href = 'https://'+baseEdit+href;
                }

                //if there is an href on the anchor and it's not an in-page anchor
                if(href && !href.includes('#')){
                  if(isValidUrl(href)) {
                    if(links_db.includes(href)) {
                      //to do, add this as a source
                    } else {
                      let link_domain = new URL(href).hostname;
                      let isInGalaxy = false;
                      if(nmGalaxyHosts.includes(link_domain)) {
                        isInGalaxy = true;
                      }

                      let linkData = {
                        link_url: href,
                        link_domain: link_domain,
                        link_source: '{'+res.options.uri+'}',
                        crawled: false,
                        nm_galaxy: isInGalaxy,
                        nm_universe: false //we've included this column but haven't yet dealt with the logic of it. this is probably something better accomplished outside the crawling flow through db queries
                      }

                      saveLink(linkData) //save it to our links db
                      links_db.push(href); //push this to our in-memory array pulled from the db (but not yet synced) so we don't keep trying to save it
                    }
                  }

                }
                
              });
          }
          setToCrawled(res.options.uri);
          done();
      }
  });




  let goodLinks = await pullAndCleanLinks();
  c.queue(goodLinks);
  c.on('drain', async () => {
    let cleanUpInvalid = setBatchToInvalid();
    console.log('restart this thing')
    let newLinkBatch = await pullAndCleanLinks();
    c.queue(newLinkBatch)
  })
  

})();

