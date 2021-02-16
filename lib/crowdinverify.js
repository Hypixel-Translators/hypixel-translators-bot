const puppeteer = require("puppeteer")
const { v4 } = require("uuid");
const { getDb } = require("./mongodb");
const fs = require("fs");

async function crowdinVerify(message) {
    let url = message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)[0];
    const browser = await getBrowser();
    const page = await browser.pupBrowser.newPage();
    await page.goto(url);
    await page.waitForSelector(".project-name");
    const evalReturn = await page.evaluate(() => {
        let obj = {};

        for (let i = 0; i < document.querySelector(".project-list-container").firstElementChild.firstElementChild.children.length; i++) {
            let type = document.querySelector(".project-list-container").firstElementChild.firstElementChild.children[i].textContent;
            if (type === "Own") type = "Managed";
            console.log(type);
            const projects = document.querySelector(".project-list-container").firstElementChild.firstElementChild.children[i + 1].children;
            for (let o = 0; o < projects.length; o++) {
                const element = projects[o];
                const name = Array.from(element.children).find(c => c.className === "project-table-name").textContent;
                obj[name] = {
                    role: type
                }
                if (type !== "Managed") {
                  obj[name].langElem = `#profile-projects-list > div > div:nth-child(${i + 2}) > div:nth-child(${o + 1}) > div.pull-right.project-table-others > div.project-table-translations > div`;
                  const { top, left } = document.querySelector(`#profile-projects-list > div > div:nth-child(${i + 2}) > div:nth-child(${o + 1}) > div.pull-right.project-table-others > div.project-table-translations > div`).getBoundingClientRect();
                  obj[name].cords = { top, left };
                }
            }

            i++;
        }
        return obj;
    });

    console.log(evalReturn);

    for (let i = 0; i < Object.keys(evalReturn).length; i++) {
        const element = evalReturn[Object.keys(evalReturn)[i]];
        console.log(element);
        if (element.langElem) {
          await page.hover(element.langElem);
          await page.mouse.move(element.cords.left + 5, element.cords.top + 5);
<<<<<<< Updated upstream
=======
          await page.click(element.langElem);
>>>>>>> Stashed changes
            element.languages = await page.evaluate((langElem) => {
              console.log(langElem);
                const elem = document.querySelector(langElem);
                console.log(elem.children);
                const languages = {};
                for (let i = 0; i < elem.children[1].children[1].children.length; i++) {
                    const languageElem = elem.children[1].children[1].children[i];
                    languages[languageElem.children[1].href.split("/")[3]] = languageElem.children[0].title;
                }
                return languages;
            }, element.langElem);
        }
    }

    fs.writeFileSync("../test.json", JSON.stringify(evalReturn));

    //const langDb = await getDb().collection("langdb").find().toArray()

    /*
    {
      [name:string]: { <- Name of the project
        role: [Manage/Own|Contribute|Pending]
        langElem: Dom Elment that needs hovering to see the languages.
        languages?: {
          [lang:string]: <- Id of the language [Translator|Proofreader]
        }
      }
    }
    */



    closeConnection(browser.uuid);
    return;
}

module.exports = { crowdinVerify }


let browser = null,
    interval = null,
    lastRequest = 0,
    activeConnections = [],
    browserClosing = false;

/**
 * Returns the browser and an connection ID.
 */
async function getBrowser() {
    //* If browser is currently closing wait for it to fully close.
    await new Promise(resolve => {
        let timer = setInterval(() => {
            if (!browserClosing) {
                clearInterval(timer);
                resolve();
            }
        }, 100);
    });

    lastRequest = Date.now();

    //* Open a browser if there isn't one already.
    if (!browser) {
        browser = await puppeteer.launch({
            args: ["--no-sandbox"],
            headless: process.env.NODE_ENV === "production"
        });
    }

    //* Add closing interval if there isn't one already.
    if (!interval) {
        interval = setInterval(async () => {
            if (lastRequest < Date.now() - 15 * 60 * 1000) {
                await browser.close();
                browser = null;
                clearInterval(interval);
                interval = null;
            }
        }, 5000);
    }

    //* Open new connection and return the browser with connection id.
    const browserUUID = v4();
    activeConnections.push(browserUUID);
    return { pupBrowser: browser, uuid: browserUUID };
}

/**
 * Close connection, and close browser if there are no more connections.
 * @param uuid The connection ID
 */
async function closeConnection(uuid) {
    //* Check if connection exists. If it does remove connection from connection list.
    const index = activeConnections.indexOf(uuid);
    if (index > -1) {
        activeConnections.splice(index, 1);
    }

    //* Close browser if connection list is empty.
    if (!activeConnections.length) {
        browserClosing = true;
        await browser.close();
        browser = null;
        clearInterval(interval);
        interval = null;
        browserClosing = false;
    }
}

/**
 * Update the lastRequest so the browser doesn't automatically close due to inactivity.
 * @param uuid The connection ID
 */
function updateConnection(uuid) {
    //* Check if connection exists. If it does update the lastRequest.
    const index = activeConnections.indexOf(uuid);
    if (index > -1) {
        lastRequest = Date.now();
    }
}