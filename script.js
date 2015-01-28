/**
 * Alfred iMessage buddy filter script
 * @author Steven Op de beeck <steven@opdebeeck.org>
 * @version 1
 */

var MAX_RESULTS = 9
var APP_messages = "Messages"
var APP_contacts = "Contacts"
var MESSAGES_URL = "imessage:\/\/"
var IMESSAGE_STYPE = "iMessage"
var UNKOWN_MSG = "Type complete contact address or phone number"
var UNKNOWN_BUDDY = function(query) { return new Buddyitem(UNKOWN_MSG, query); }


/**
 * Returns an array containing the unique elements from the input array
 * @private
 * @param {Array} arr - The input array
 * @param {optional String} prop - The property to use as the unique key for matching
 * @returns An array with unique elements
 * @type Array
 */
function uniq(arr, prop) {
    var seen = {};
    return arr.filter(
        function(elem) {
        	var key = (prop == undefined) ? elem : elem[prop];
            return seen.hasOwnProperty(key) ? false : (seen[key] = true);
        });
}


/**
*/
function Buddyitem(handle, name) {
	this.handle = handle
	this.name = name
}

Buddyitem.prototype.to_xml = function(){
	var result = "\t<item";
	result += " uid=\"" + this.handle + "\"";
	result += " arg=\"" + MESSAGES_URL + this.handle + "\"";
	result += ">\n";
    result += "\t\t<title>" + this.name + "</title>\n";
    result += "\t\t<subtitle>" + this.handle + "</subtitle>\n";
    result += "\t</item>\n";
    return result;
};


/**
 * Script run-handler
 * @param {String} arg The query
 * @returns iMessage buddies that satisfy the query (Alfred XML structure)
 * @type String
 */
function run(query) {
    var app_msgs = Application(APP_messages);
    var app_ctcs = Application(APP_contacts);
    matching_buddyitems = lookup_buddies(app_msgs, app_ctcs, query);
    matching_buddyitems = matching_buddyitems.slice(0,MAX_RESULTS)
    return build_xml(matching_buddyitems, query)
}


function build_xml(buddyitems, query) {
	var result = "<?xml version=\"1.0\"?>\n";
	result += "<items>\n";

	if (buddyitems.length == 0) {
		result += UNKNOWN_BUDDY(query).to_xml()
	} else {
		buddyitems.forEach(
			function(element, index) {
				result += element.to_xml()
		});

		result += "</items>";
	}

	return result;
}


function lookup_buddies(messages, contacts, query) {
	var matching_in_msg = lookup_buddies_messages(messages, query);
	console.log("msg");
	var matching_in_cts = lookup_buddies_contacts(contacts, query);
	console.log("cts");
	var matching_items = matching_in_msg.concat(matching_in_cts);

	return uniq(matching_items, 'handle');
}

/**
*/
function lookup_buddies_messages(app, query){
	var result = []
    
    var matching_buddies = app.buddies.whose(
        { _or: [ 
           { name: { _contains: query } },
           { fullName: { _contains: query } },
           { handle: { _contains: query } }
           ] 
       }, { ignoring: ['case']});
    
    var handles = uniq(matching_buddies.handle());
    
	handles.forEach(
		function(element, index) {
	        sel_buddy = matching_buddies.whose({ handle: element })[0];
    
	        if (sel_buddy.service.serviceType() === IMESSAGE_STYPE) {
	            var item = new Buddyitem(sel_buddy.handle(),sel_buddy.name())
	            result.push(item)
	        }
	    }
	);

    return result
}

function lookup_buddies_contacts(app, query) {

	var result = []
	
	var matching_buddies = app.people.whose(
	{ _or: [
		{ name: { _contains: query } },
		{ nickname: { _contains: query } }
		]
	}, { ignoring: ['case']});

	var ids = matching_buddies.id();

	for (var i = 0; i < MAX_RESULTS && i < ids.length ; i++) {
		// there is one, and only one.
		sel_buddy = matching_buddies.whose({ id: ids[i] })[0];

		sel_buddy.phones().forEach(
			function(element, index){
				var val = element.value().replace(/\s+/g, '');
				result.push(new Buddyitem(val, sel_buddy.name()))				
		});
	}

	return result
}

// function build_item_xml(arr) {
//     var result = "\t<item";
// 	result += " uid=\"" + arr[0] + "\"";
// 	result += " arg=\"" + MESSAGES_URL + arr[0] + "\"";
// 	result += ">\n";
//     result += "\t\t<title>" + arr[1] + "</title>\n";
//     result += "\t\t<subtitle>" + arr[2] + "</subtitle>\n";
//     result += "\t</item>\n";
//     return result;
// }

// function handle_buddy(buddy) {
//     return build_item_xml([buddy.handle(), buddy.name(), buddy.handle()]);
// }

// function handle_unknown(unknown) {
//     return build_item_xml([unknown, unknown, "Type complete contact address or phone number"]);
// }