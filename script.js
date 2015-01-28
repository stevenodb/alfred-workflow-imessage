/**
 * Alfred iMessage buddy filter script
 * @author Steven Op de beeck <steven@opdebeeck.org>
 * @version 1
 */

var MAX_RESULTS = 9
var APP_messages = "Messages"
var APP_contacts = "Contacts"
var MESSAGES_URL = "imessage:\/\/"

/**
 * Script run-handler
 * @param {String} arg The query
 * @returns iMessage buddies that satisfy the query (Alfred XML structure)
 * @type String
 */
function run(arg) {
    var app_msgs = Application(APP_messages);
    var app_ctcs = Application(APP_contacts) 
    return lookup_buddies(app_msgs, app_ctcs, arg);
}


function buddy(handle, name) {
	this.handle = handle
	this.name = name
}

/**
*/
function lookup_buddies(messages, contacts, query){
	var result = "<?xml version=\"1.0\"?>\n";
    
    var matching_buddies = messages.buddies.whose(
        { _or: [ 
           { name: { _contains: query } },
           { fullName: { _contains: query } },
           { handle: { _contains: query } }
           ] 
       }, { ignoring: ['case']});
    
    var handles = uniq(matching_buddies.handle());
    
    result += "<items>\n";

    if (handles.length > 0) {
        for (var ih = 0; ih < MAX_RESULTS && ih < handles.length ; ih++) {
            selected_buddy = matching_buddies.whose({ handle: handles[ih] })[0];
            
            if (selected_buddy.service.serviceType() === 'iMessage') {
                result += handle_buddy(selected_buddy);
            }
        }
    } else {
        result += handle_unknown(query);
    }

    result += "</items>";

    return result
}


/**
 * Returns an array containing the unique elements from the input array
 * @private
 * @param Array arr The input array
 * @returns An array with unique elements
 * @type Array
 */
function uniq(arr) {
    var seen = {};
    return arr.filter(
        function(elem) {
            return seen.hasOwnProperty(elem) ? false : (seen[elem] = true);
        });
}

function build_item_xml(arr) {
    var result = "\t<item";
	result += " uid=\"" + arr[0] + "\"";
	result += " arg=\"" + MESSAGES_URL + arr[0] + "\"";
	result += ">\n";
    result += "\t\t<title>" + arr[1] + "</title>\n";
    result += "\t\t<subtitle>" + arr[2] + "</subtitle>\n";
    result += "\t</item>\n";
    return result;
}

function handle_buddy(buddy) {
    return build_item_xml([buddy.handle(), buddy.name(), buddy.handle()]);
}

function handle_unknown(unknown) {
    return build_item_xml([unknown, unknown, "Type complete contact address or phone number"]);
}