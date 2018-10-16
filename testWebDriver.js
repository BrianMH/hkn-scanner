const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const cheerio = require('cheerio');
const USER = require("os").userInfo().username; // Needs adjustment for NT OSes

/*---------------- MODIFY THESE PARAMETERS FOR LOGIN ------------------------*/
// Before anyone points it out, yes, this is unsecure. It shouldn't be an issue
// for the current use case (which is testing this script)
VENMO_USERNAME = "";
VENMO_PASSWORD = "";
/*---------------------------------------------------------------------------*/

/*-----------------  SET EARLIEST TRANSACTION DATE --------------------------*/
const EARLIEST_TRANS_DATE = new Date("December 18, 2017 03:20:10")
/*---------------------------------------------------------------------------*/

// Function to execute login for selenium web driver. Returns promise 
// to wait three seconds before allowing subsequent modification
async function loginActions() {
	driver.actions({bridge: true}).sendKeys(webdriver.Key.TAB + webdriver.Key.TAB)
									.sendKeys(VENMO_USERNAME)
									.sendKeys(webdriver.Key.TAB)
									.sendKeys(VENMO_PASSWORD)
									.sendKeys(webdriver.Key.TAB)
									.sendKeys(webdriver.Key.ENTER)
									.perform();
	return driver.sleep(3000);
}

// Tells web driver to open up the current feed.
// Returns a promise to wait three seconds before allowing subsequent
// modification
async function checkPVenmoFeed() {
	// get personal feed
	driver.get("https://venmo.com/?feed=mine")
	return driver.sleep(3000);
}

// Waits until the url changes to the desired page to scrape.
// returns a promise in order to allow time before recording
// page source.
async function waitForURL() {
	// try grabbing transaction history after page loads
	while(true) {
		let curUrl = await driver.getCurrentUrl();
		// console.log(curUrl);
		if(curUrl == "https://venmo.com/?feed=mine") {
			break;
		}
	}
	return driver.sleep(1000);
}

// Uses the selenium driver to be able to see more of the
// feed by executing js script upon pressing button.
async function enlargeFeedRequest() {
	let button = driver.findElement(webdriver.By.xpath('//button[text()="Load more stories"]'));
	button.click();
	return driver.sleep(1000);
}

// Given a page source, use cheerio in order to scrape needed transactions.
// Returns a list containing the desired list of transactions.
async function attemptParse(pageSource) {
	// constant used when modifying date string
	let DATE_APPEND_STRING = "Public Friends PrivateAmounts are always private.";

	// load source using cheerio
	let $ = cheerio.load(pageSource);

	// unroll until earliest desired date
	let transactionList = []
	date = Date.now();
	while(date > EARLIEST_TRANS_DATE) {
		let lastDate = $(".feed-story-payment").find(".feed-description__notes__meta");
		lastDate = lastDate[lastDate.length-1];   // find last date
		lastDate = new Date($(lastDate).eq(0).text().replace(DATE_APPEND_STRING, ""));
		console.log(lastDate);

		// enlarge list if possible, otherwise break
		if($(".feed-more").length == 1) {
			await enlargeFeedRequest();			// wait for expand request to finish
			let newSource = await driver.getPageSource()	// then grab page source from 'new' page
			$ = cheerio.load(newSource);
		} else {
			break;	// exit to process tx list
		}
	}

	// work way through source to collect all desired entries from final page source
	$(".feed-story-payment").each(function (i, elem) {
		// prepare new json entry for addition
		transactionList.push({})

		// preprocess required entries
		let tempDate = $(this).find(".feed-description__notes__meta");
		let tempSwapUsers = $(this).find(".feed-description__notes__headline").text().trim().split(" paid ");
		let tempExchAmt = parseFloat($(this).find(".feed-description__amount").text().replace("$", ""));

		// log required entires in json
		transactionList[i].exchangeDate = new Date($(tempDate).eq(0).text().replace(DATE_APPEND_STRING, ""));
		transactionList[i].exchangeUser1 = tempSwapUsers[0];
		transactionList[i].exchangeUser2 = tempSwapUsers[1];
		transactionList[i].exchangeAmount = tempExchAmt;

		// console log outputs
		console.log(transactionList[i].exchangeDate);
		console.log(tempSwapUsers);
		console.log(tempExchAmt);
	})

	return transactionList;
}

// Central async function. Returns a list of transactions that occurred after
// the above indicated date.
async function testScraping() {
	// Create headless form of chrome for usage by driver
	let copts = new chrome.Options();
	// copts.addArguments('--headless');
	copts.addArguments('--user-data-dir=/home/'+USER+'/.config/google-chrome/');
	driver = new webdriver.Builder().forBrowser('chrome')
						.setChromeOptions(copts)
						.build();

	// Use driver to login to Venmo
	// NOTE: DO THIS AT LEAST ONCE TO PREVENT VERIFICATION MESSAGES!
	driver.get("https://venmo.com/account/sign-in");
	await driver.sleep(500).then(loginActions)
						   .then(checkPVenmoFeed)
						   .then(waitForURL);

	// try scraping)
	let results = await driver.getPageSource().then(attemptParse);
	// driver.close();
	return results;
}

// execute
transactionList = testScraping().then(function(toLog) {
	console.log(toLog);
});