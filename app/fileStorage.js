import * as mdb from "mdb-server";

const dbName = "document_store"
const blockchainName = "descriptions"
const imageName = "blockpointImage"

let conn = await mdb.CreateConnection(
    {
        username: "system",
        password: "biglove",
        serverAddress: "0.0.0.0",
        serverPort: 5461,
        databaseName: "master",
        parameters: new Map([["interpolateParams", true]])
    }
)

// Connect to the database
try {
    await conn.connect()
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}


let rows;
try {
    rows = await conn.query("SELECT name FROM sys_database WHERE sys_database.name = ?", [dbName])
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

// If the database doesn't already exist, create it
if (rows.sets[0].rows.length === 0) {
    try {
        await conn.exec(`CREATE DATABASE ${dbName}`)
    } catch (err) {
        await conn.close()
        console.log(err)
        process.exit(1)
    }
}

try {
    await conn.exec(`USE ${dbName}`)
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

try {
    rows = await conn.query("SELECT sys_blockchain_id FROM sys_blockchain WHERE sys_blockchain.name = ?", [blockchainName])
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

// Create a reference blockchain for the files
if (rows.sets[0].rows.length === 0) {
    try {
        await conn.exec(`CREATE BLOCKCHAIN ${dbName}.${blockchainName} HISTORICAL PLUS (
        id UINT64 AUTO INCREMENT PRIMARY,
        file_id UINT64 FOREIGN KEY [document_store.sys_file, sys_file_id],
        description STRING PACKED)`)
    } catch (err) {
        await conn.close()
        console.log(err)
        process.exit(1)
    }
}

try {
    rows = await conn.query("SELECT filename FROM sys_file WHERE sys_file.filename = ?", [imageName])
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

// If the file hasn't been stored yet, store it in the DB
let resp;
if (rows.sets[0].rows.length === 0) {
    try {
        resp = await conn.storeFile(imageName, "app/blockpoint.png", "png")
    } catch (err) {
        await conn.close()
        console.log(err)
        process.exit(1)
    }

    const description = "My first stored file"
    try {
        resp = await conn.exec(`INSERT ${dbName}.${blockchainName} (file_id, description) VALUES 
    (?, ?)`,
            [resp.getLastInsertId(), description])
    } catch (err) {
        await conn.close()
        console.log(err)
        process.exit(1)
    }
}

// Verify the integrity of the file before retrieval
try {
    resp = await conn.exec("CHECK VALIDITY")
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

// Export and save the file into 'exports'
try {
    resp = await conn.exportFile(imageName, "app/exports/out_image.png", "png")
    await resp.saveFile()
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

// Retrieve the file descriptions
try {
    rows = await conn.query(`SELECT description FROM ${dbName}.${blockchainName}`)
} catch (err) {
    await conn.close()
    console.log(err)
    process.exit(1)
}

for (const row of rows) {
    let rowColumn = row.get("description");
    let deserialize = rowColumn.deserialize()
    console.log(deserialize)
}

// Close the connection
await conn.close()
