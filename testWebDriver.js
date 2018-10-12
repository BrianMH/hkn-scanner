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
const EARLIEST_TRANS_DATE = new Date("December 18, 1995 03:20:10")
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
function enlargeFeedRequest() {
	let button = driver.findElement(webdriver.By.xpath('//button[text()="Load more stories"]'));
	button.click();
	let source = driver.sleep(500).then(driver.getPageSource
							  .then(function(echo) {return echo;}));
	return source;
}

// Given a page source, use cheerio in order to scrape needed transactions.
// Returns a list containing the desired list of transactions.
function attemptParse(pageSource) {
	// constant used when modifying date string
	let DATE_APPEND_STRING = "Public Friends PrivateAmounts are always private.";

	// load source using cheerio
	let $ = cheerio.load(pageSource);

	// unroll until earliest desired date
	transactionList = []
	date = Date.now();
	while(date > EARLIEST_TRANS_DATE) {
		let lastDate = $(".feed-story-payment").find(".feed-description__notes__meta")[7];
		lastDate = new Date($(lastDate).eq(0).text().replace(DATE_APPEND_STRING, ""));
		console.log(lastDate);

		// enlarge list if possible, otherwise break
		if($(".feed-more").length == 1) {
			let newSource = enlargeFeedRequest();
			$ = newSource;
		} else {
			break;	// exit to process tx list
		}
	}

	// work way through source to collect all desired entries


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
	let results = driver.getPageSource().then(attemptParse);
	// driver.close();
	return results;
}

// execute
transactionList = testScraping();
// console.log(transactionList);