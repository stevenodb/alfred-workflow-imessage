# alfred-workflow-imessage
Alfred plugin for buddy completion from the iMessage app

This plugin is keyword triggered and will use your (partial) input argument to match iMessage buddies from the Messages app. The script will match on buddy properties such as firstname, lastname, full name, handle. The matched buddies are shown in a list. Selecting one will open the Messages app with his/her conversation window active.

## installation

1. Download the repository as zip file 
	- (Right-click > Download Linked File As... to avoid unzip on OS X)
2. Rename Master.zip to Messages.alfredworkflow
3. Open Messages.alfredworkflow with Alfred by double clicking

## limitations
1. The Messages app only provides a list of recent imessage buddies.
2. Including contacts from the Contact apps slowed down the script too much.