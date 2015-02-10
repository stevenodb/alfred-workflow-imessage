/**
 * Alfred iMessage buddy filter script
 * @author Steven Op de beeck <steven@opdebeeck.org>
 * @version 1
 */

MAX_RESULTS = 9
APP_messages = "Messages"
APP_contacts = "Contacts"
SYS_EVENTS = "System Events"
MESSAGES_URL = "imessage:\/\/"
IMESSAGE_STYPE = "iMessage"
UNKOWN_MSG = "Type complete contact address or phone number"
UNKNOWN_BUDDY = function(query) {
	return new BuddyItem(query, query, UNKOWN_MSG);
}

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
			var key = (prop === undefined) ? elem : elem[prop];
			return seen.hasOwnProperty(key) ? false : (seen[key] = true);
		});
}


/**
 * BuddyItem class represents a buddy with its handle, name and an 
 * optional description.
 * @param {String} handle - the handle
 * @param {String} name — the name
 * @param {optional String} description – optional description
 */
function BuddyItem(handle, name, description) {
	this.handle = handle;
	this.name = name;
	this.description = description;
}

/**
 * Output function for XML
 */
BuddyItem.prototype.to_xml = function() {
	var result = "\t<item";
	result += " uid=\"" + this.handle + "\"";
	result += " arg=\"" + MESSAGES_URL + this.handle + "\"";
	result += ">\n";
    result += "\t\t<title>" + this.name + "</title>\n";
    result += "\t\t<subtitle>" + ((this.description === undefined) ? this.handle : this.description) + "</subtitle>\n";
    result += "\t</item>\n";
    return result;
};


/**
 * Script run-handler
 * @param {String} query The search query
 * @returns iMessage buddies that satisfy the query (Alfred XML structure)
 * @type String
 */
function run(query) {
	var sys_events = Application(SYS_EVENTS)
	// APP_ctcs_running = sys_events.processes.whose({ name: APP_contacts }).length > 0;

    var app_msgs = Application(APP_messages);
    var app_ctcs = null;
    // var app_ctcs = Application(APP_contacts);

    matching_buddyitems = _lookup_buddies(query, app_msgs);

    if (matching_buddyitems.length > MAX_RESULTS) { 
    	matching_buddyitems = matching_buddyitems.slice(0,MAX_RESULTS)
    }

    // if (!APP_ctcs_running) Application(APP_contacts).quit();

    return _build_xml(matching_buddyitems, query)
}

/**
 * Function that builds an Alfred XML string
 * @param {Array.<BuddyItem>} buddyitems - a list of buddyitem objects
 * @param {String} query - the query
 * @returns a string in XML format
 * @private
 */
function _build_xml(buddyitems, query) {
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

/**
* Look up and combine buddies from various apps
* @param {String} query - the search string
* @param {Application} messages - the messages app
* @returns an array of matching BuddyItem objects
*/
function _lookup_buddies(query, messages) {
	var matching_items = []
	matching_items = matching_items.concat(_lookup_buddies_messages(query, messages));
	// matching_items = matching_items.concat(_lookup_buddies_contacts(contacts, query));

	return uniq(matching_items, 'handle');
}

/**
* Look up buddies in the Message app.
* @param {String} query - the search string
* @param {Application} messages - the messages app
* @returns an array of matching BuddyItem objects
* @type Array.<BuddyItem>
*/
function _lookup_buddies_messages(query, app){
	var result = []

    var matching_buddies = app.buddies.whose(
        { _or: [ 
           { name: { _beginsWith: query } },
           { fullName: { _beginsWith: query } },
           { firstName: { _beginsWith: query } },
           { lastName: { _beginsWith: query } },
           { handle: { _contains: query } }
           ] 
       }, { ignoring: ['case']});
    
    var handles = uniq(matching_buddies.handle());
    
	handles.forEach(
		function(element, index) {
	        sel_buddy = matching_buddies.whose({ handle: element })[0];
    
	        if (sel_buddy.service.serviceType() === IMESSAGE_STYPE) {
	            var item = new BuddyItem(sel_buddy.handle(),sel_buddy.name())
	            result.push(item)
	        }
	    }
	);

    return result
}

// removed, because too slow
// function _lookup_buddies_contacts(app, query) {

// 	var result = []

// 	var matching_contacts = app.people.whose(
// 	{ _or: [
// 		{ firstName: { _beginsWith: query } },
// 		{ lastName: { _beginsWith: query } },
// 		{ nickname: { _beginsWith: query } },
// 		// { _match: [ phones, query ] }
// 		]
// 	}, { ignoring: ['case']});

// 	matching_contacts().forEach(
// 		function(contact, index) {
// 			contact.phones().forEach(function(phone, index){
// 				var val = phone.value().replace(/\s+/g, '');
// 				result.push(new BuddyItem(val, contact.name() + " (contacts)"))			
// 			});
// 		});

// 	return result
// }