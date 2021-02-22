const puppeteer = require("puppeteer"),
	{ v4 } = require("uuid"),
	{ getDb } = require("./mongodb");

const projectIDs = {
		128098: { name: "Hypixel", langRoles: true },
		369653: { name: "Quickplay", langRoles: true },
		436418: { name: "Bot", langRoles: false },
		369493: { name: "SkyblockAddons", langRoles: false }
	},
	UsefulIDs = {
		Alerted: "756199836470214848",
		Verified: "569194996964786178",
		logChannel: "662660931838410754"
	};

async function crowdinVerify(message) {
	const url = message.content,
		browser = await getBrowser(),
		page = await browser.pupBrowser.newPage();
	await page.goto(url);
	await page.waitForSelector(".project-name");
	const evalReturn = await page.evaluate(() => {
		return window.eval(crowdin.profile_projects.view.state.projects);
	});
	closeConnection(browser.uuid);

	let highestLangRoles = {};

	evalReturn
		.filter(project => Object.keys(projectIDs).includes(project.id))
		.forEach(project => {
			updateProjectRoles(projectIDs[project.id].name, message, project);
			if (projectIDs[project.id].langRoles)
				project.contributed_languages?.forEach(lang => {
					if (
						highestLangRoles[lang.code] &&
						highestLangRoles[lang.code] !== "Proofreader" &&
						lang.user_role.name === "Proofreader"
					)
						highestLangRoles[lang.code] = "Proofreader";
					else if (!highestLangRoles[lang.code])
						highestLangRoles[lang.code] = lang.user_role.name;
				});
		});

	updateLanguageRoles(highestLangRoles, message);

	await message.member.roles.remove(UsefulIDs.Alerted, "User is now Verified");
	await message.member.roles.add(UsefulIDs.Verified, "User is now Verified");
	await getDb()
		.collection("users")
		.updateOne({ id: message.member.user.id }, { $set: { profile: url } });

	// message.client.channels.cache
	// 	.get(UsefulIDs.logChannel)
	// 	.send(
	// 		`${message.member} has verified their Crowdin profile! Here's their Crowdin profile: ${url}`
	// 	);
	return;
}

module.exports = { crowdinVerify };

/**
 *
 * @param {"Hypixel"|"Quickplay"|"SkyblockAddons"|"Bot"} projectName
 * @param {*} message
 * @param {boolean} langRoles
 * @param {{
    id: string;
    name: string;
    identifier: string;
    join_policy: string;
    last_activity: string;
    created_at_timestamp: number;
    last_activity_timestamp: number;
    joined_at_timestamp: number;
    last_seen_timestamp: number;
    user_role: string;
    contributed_languages?: {
        name: string;
        code: string;
        organization_id?: any;
        url: string;
        user_role: {
            alias: string,
            name: string
        };
    }[];
}} project
 */
async function updateProjectRoles(projectName, message, project) {
	const role = project.contributed_languages?.length
		? project.contributed_languages.map(lang => {
				return {
					lang: lang.code,
					role: lang.user_role.name
				};
		  })
		: [{ role: project.user_role }];

	let highestRole = "Translator";
	role.forEach(role => {
		if (role.role !== "Translator") {
			if (role.role !== "Manager") highestRole = role.role;
			if (highestRole == "manager") highestRole = "Manager";
		}
	});

	const projectTransRole = (
			await message.guild.roles.cache.find(
				r => r.name === `${projectName} Translator`
			)
		).id,
		projectProofRole = (
			await message.guild.roles.cache.find(
				r => r.name === `${projectName} Proofreader`
			)
		).id,
		projectManagerRole = (
			await message.guild.roles.cache.find(
				r => r.name === `${projectName} Manager`
			)
		).id;

	if (highestRole === "Translator") {
		if (await message.member.roles.cache.has(projectProofRole))
			await message.member.roles.remove(
				projectProofRole,
				"User no longer has this role on Crowdin"
			);

		if (await message.member.roles.cache.has(projectManagerRole))
			await message.member.roles.remove(
				projectManagerRole,
				"User no longer has this role on Crowdin"
			);

		await message.member.roles.add(
			projectTransRole,
			"User has received this role on Crowdin"
		);
	} else if (highestRole === "Proofreader") {
		if (await message.member.roles.cache.has(projectTransRole))
			await message.member.roles.remove(
				projectTransRole,
				"User no longer has this role on Crowdin"
			);

		if (await message.member.roles.cache.has(projectManagerRole))
			await message.member.roles.remove(
				projectManagerRole,
				"User no longer has this role on Crowdin"
			);

		await message.member.roles.add(
			projectProofRole,
			"User has received this role on Crowdin"
		);
	} else {
		if (await message.member.roles.cache.has(projectTransRole))
			await message.member.roles.remove(
				projectTransRole,
				"User no longer has this role on Crowdin"
			);

		if (await message.member.roles.cache.has(projectProofRole))
			await message.member.roles.remove(
				projectProofRole,
				"User no longer has this role on Crowdin"
			);

		await message.member.roles.add(
			projectManagerRole,
			"User has received this role on Crowdin"
		);
	}
}

/**
 * @param {{[name: string]: "Translator" | "Proofreader"}} highestLangRoles
 */
async function updateLanguageRoles(highestLangRoles, message) {
	const coll = await getDb().collection("langdb"),
		activeRoles = [],
		addedRoles = [];

	for (const [k, v] of Object.entries(highestLangRoles)) {
		activeRoles.push(`${(await coll.findOne({ id: k })).name} ${v}`);
	}

	message.member.roles.cache.forEach(role => {
		if (role.name.includes("Translator") || role.name.includes("Proofreader"))
			addedRoles.push(role.name);
	});

	activeRoles
		.filter(pj => !addedRoles.includes(pj))
		.forEach(async p => {
			await message.member.roles.add(
				(await message.guild.roles.cache.find(r => r.name === p)).id,
				"User has received this role on Crowdin"
			);
		});

	console.log(addedRoles, activeRoles);

	addedRoles
		.filter(p => !p.includes(activeRoles.filter(pj => addedRoles.includes(pj))))
		.forEach(async d => {
			await message.member.roles.remove(
				(await message.guild.roles.cache.find(r => r.name === d)).id,
				"User no longer has this role on Crowdin"
			);
		});
}

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
