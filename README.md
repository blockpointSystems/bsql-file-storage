# bsql-file-storage
This is an example script for storing files and relevant metadata in bSQL using node.

# Step 1: download node modules
`npm download`

# Step 2: create an exports folder
Create a directory called `exports` within the `app` folder, exported files are stored in `app/exports` 

# Step 3: update your server information in fileStorage.js
To connect to the right instance you'll have to update `CreateConnection` with the `username`, `password` and `serverAddress`

# Step 4: run the code
Running `npm run` will run `fileStorage.js` and store/retrieve the image from bSQL
