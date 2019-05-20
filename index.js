const Vec3 = require('tera-vec3');
const NullVec = new Vec3(0, 0, 0);

const BRAWLER = 10;
const GROUP_HM = 6;
const ID_BLK = 67130074;
const ID_RHK = 67179964;
const DELAY = 400;
const OFFSET = 0x4000000;

module.exports = function hayy(dispatch) {
	let hooks = [];

	dispatch.hook('S_LOGIN', 10, {filter: {fake: null}}, (event) => {
		if ((event.templateId - 10101) % 100 == BRAWLER) {
			load(event.gameId);
		}
	});

	function load(cid) {
		let cancelHaymaker;	// stores a timer object when Haymaker starts; undefined by default and once Haymaker has finished; null when Haymaker resets

		hook('S_ACTION_STAGE', 4, {filter: {fake: null}, order: -20}, (event) => {
			if (event.gameId.equals(cid) && getGroup(event.skill) == GROUP_HM && cancelHaymaker === undefined && event.stage == 0) {
				cancelHaymaker = setTimeout(function () {
					// Cancel with RHK
					dispatch.toServer('C_START_SKILL', 5, {
						skill: ID_RHK,
						w: event.w,
						loc: event.loc,
						dest: NullVec,
						unk: true,
						unk2: false,
						moving: false,
						continue: false,
						target: 0,
					});

					// Cancel by tapping block
					//dispatch.toServer('C_PRESS_SKILL', 2, {
					//	skill: ID_BLK,
					//	press: true,
					//	loc: event.loc,
					//	w: event.w,
					//});

					//dispatch.toServer('C_PRESS_SKILL', 2, {
					//	skill: ID_BLK,
					//	press: false,
					//	loc: event.loc,
					//	w: event.w,
					//});

					// Show a message when cancelled
					dispatch.toClient('S_DUNGEON_EVENT_MESSAGE', 1, {
						message: "<font color=\"#EFBBCC\">Cancelled Haymaker!</font>",
						unk1: 2,
						unk2: 0,
						unk3: 0,
					});
				}, DELAY);
			}
		});

		hook('S_CREST_MESSAGE', 2, {filter: {fake: null}, order: -20}, (event) => {
			if (event.type == 6 && getGroup(event.skill + OFFSET) == GROUP_HM) {
				if (cancelHaymaker) {
					clearTimeout(cancelHaymaker);
					cancelHaymaker = undefined;
				}
				else {
					cancelHaymaker = null;
				}
			}
		});

		hook('S_ACTION_END', 3, {filter: {fake: null}, order: -20}, (event) => {
			if (event.gameId.equals(cid) && getGroup(event.skill) == GROUP_HM) {
				if (cancelHaymaker !== undefined) {
					if (cancelHaymaker !== null) {
						clearTimeout(cancelHaymaker);
					}

					cancelHaymaker = undefined;
				}
			}
		});

		function getGroup(skill) {
			return Math.floor((skill - OFFSET) / 10000);
		}
	}

	function unload() {
		if (hooks.length > 0) {
			for (let h of hooks) {
				dispatch.unhook(h);
			}

			hooks = [];
		}
	}

	function hook() {
		hooks.push(dispatch.hook(...arguments))
	}
}