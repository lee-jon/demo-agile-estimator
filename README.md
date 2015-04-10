# Example events

## User actions
A user joins
 - enters a room
 - enters a name
 - selects whether observer or not

 + Broadcast new user
 + Add user to user list

A user leaves
 + Broadcast user left

A user resets estimates
 - estimate reset
 + broadcast reset estimates

A user estimates
 - estimate sent to server
 + broadcast user has estimate
   - count est vs reveal
 + store estimate

A user requests reveal
 + broadcast session data
