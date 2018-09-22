const 	config = require('./config.json'),
		path = require('path'),
		fs = require('fs')
module.exports = function mountpredict(d) {

let enabled = config.enabled,
	sudo = config.sudo,
	onMount = null,
	customMount = 0,
	incontract = null,
	mounts = require('./mountlist.json'),
	grounds = require('./groundlist.json')

//commands o' plenty
d.command.add("cmp", {
on() {
enabled = true
d.command.message(`[enabled]`)
},
off() {
enabled = false
d.command.message(`[disabled]`)
},
set(value) {
customMount = parseInt(value);
for (i = 0; i < INVALID.length; i++) {
if(INVALID[i] == customMount){
d.command.message('The value: '+customMount+' is invalid, try another.');
customMount = 0;}}
d.command.message('Mount set to: '+value+'.');
saveMount()
},
unmount() {
d.command.message(`[unmounted]`)
d.send('S_UNMOUNT_VEHICLE', 2, {
gameId: d.game.me.gameId,
skill: 12200016
})
d.send('S_SHORTCUT_CHANGE', 2, {
huntingZoneId: 7031,
id: 300001,
enable: false
})
d.send('C_UNMOUNT_VEHICLE', 1, {
})
},
$default() {
d.command.message("Command list")
d.command.message(" ")
d.command.message("cmp on/off")
d.command.message("--Toggles mount prediction on or off")
d.command.message(" ")
d.command.message("cmp set #")
d.command.message("--Set the type of mount you want(replace # with the number)")
d.command.message(" ")
d.command.message("cmp unmount")
d.command.message("--Dismounts you incase something bugs out and you can't")
}
})
	
//custom mount copy/paste fiesta 
const INVALID = [
4,100,105,106,107,108,109,110,111,112,
113,114,115,116,117,118,119,120,121,122,
123,124,125,126,127,128,129,130,131,132,
133,134,135,136,137,138,139,140,141,142,
143,144,145,146,147,148,149
];
try {
customMount = require('./mount.json')}
catch(e) {}
function saveMount() {
fs.writeFileSync(path.join(__dirname, 'mount.json'), JSON.stringify(customMount))
}

//cStartSkill hook instant mount function for flying mounts
d.hook('C_START_SKILL', (d.base.majorPatchVersion >= 74) ? 7 : 7, (e) => {
if(!enabled || d.game.me.inCombat || incontract || !mounts.includes(e.skill.id) || customMount < 1 || customMount > 293 || grounds.includes(customMount)) return
d.send('S_MOUNT_VEHICLE', 2, {
gameId: d.game.me.gameId,
id: customMount,
skill: 12200016,
unk: false
}),
d.send('S_SHORTCUT_CHANGE', 2, {
huntingZoneId: 7031,
id: 300001,
enable: true
})
})

//cStartSkill hook instant mount function for ground mounts
d.hook('C_START_SKILL', (d.base.majorPatchVersion >= 74) ? 7 : 7, (e) => {
if(!enabled || d.game.me.inCombat || incontract || !mounts.includes(e.skill.id) || customMount < 1 || customMount > 293 || !grounds.includes(customMount)) return
d.send('S_MOUNT_VEHICLE', 2, {
gameId: d.game.me.gameId,
id: customMount,
skill: 12200016,
unk: false
}),
d.hookOnce('S_SHORTCUT_CHANGE', 2, (e) => {
return false
})
})

//cStartSkill hook instant unmount function
d.hook('C_START_SKILL', (d.base.majorPatchVersion >= 74) ? 7 : 7, (e) => {
if(!enabled || !onMount || incontract || e.skill.id === 65000002 || e.skill.id === 65000001) return;
else if(mounts.includes(e.skill.id)){

d.send('S_UNMOUNT_VEHICLE', 2, {
gameId: d.game.me.gameId,
skill: 12200016
})

d.send('S_SHORTCUT_CHANGE', 2, {
huntingZoneId: 7031,
id: 300001,
enable: false
})
}
})

//cStartSkill hook for flying mount dismount
d.hook('C_START_SKILL', (d.base.majorPatchVersion >= 74) ? 7 : 7, (e) => {
if(!enabled || !onMount || e.skill.id === 65000002) return;
else if(e.skill.id === 65000001){
d.send('C_UNMOUNT_VEHICLE', 1, {
})
d.send('S_UNMOUNT_VEHICLE', 2, {
gameId: d.game.me.gameId,
skill: 12200016
})
d.send('S_SHORTCUT_CHANGE', 2, {
huntingZoneId: 7031,
id: 300001,
enable: false
})
}
})

//instant dive
d.hook('C_START_SKILL', (d.base.majorPatchVersion >= 74) ? 7 : 7, (e) => {
if(!enabled) return
else if(e.skill.id === 65000002){
d.send('S_START_CLIENT_CUSTOM_SKILL', (d.base.majorPatchVersion >= 74) ? 4 : 4, {
gameId: d.game.me.gameId,
skill: 65000002
})
d.hookOnce('S_START_CLIENT_CUSTOM_SKILL', (d.base.majorPatchVersion >= 74) ? 4 : 4, (e) => {return false})
}
})

//fix for teleporting while on a flying mount (im retarded and forgot a gameId check...)
d.hook('S_UNMOUNT_VEHICLE', 2, (e) => {
if(!enabled) return
else if(d.game.me.is(e.gameId)){
d.send('S_SHORTCUT_CHANGE', 2, {
huntingZoneId: 7031,
id: 300001,
enable: false
})
}
})

d.hook('S_MOUNT_VEHICLE', 2, (e) => {
if(!enabled) return;
if(d.game.me.is(e.gameId))
incontract = false
})

//sSystemMessage to instantly unmount in unmountable zones
d.hook('S_SYSTEM_MESSAGE', 1, (e) => {
if(e.message.includes('@1007') || e.message.includes('@36') || e.message.includes('@3880'))
d.send('S_UNMOUNT_VEHICLE', 2, {
gameId: d.game.me.gameId,
skill: 12200016
})
})

//temp hooks that will be replaced with game state once im not retarded
	d.hook('S_MOUNT_VEHICLE', 2, e => { if(d.game.me.is(e.gameId)) onMount = true })
	d.hook('S_UNMOUNT_VEHICLE', 2, e => { if(d.game.me.is(e.gameId)) onMount = false })
	d.hook('S_REQUEST_CONTRACT', 1, event => { incontract = true })
	d.hook('S_ACCEPT_CONTRACT', 1, event => { incontract = false })
	d.hook('S_REJECT_CONTRACT', 1, event => { incontract = false })
	d.hook('S_CANCEL_CONTRACT', 1, event => { incontract = false })
    //setInterval(() => { console.log('stuff: ' + stuff); }, 1000); //(seems like a nice place to keep it ¯\_(ツ)_/¯)

}