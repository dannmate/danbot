module.exports = {
    Contains(text,contains_text) {
       return text.indexOf(contains_text) > -1;
    },
    ReplaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    },
    GetRandomItem(cli) {
        let folders = "";

        const getFolders = offset =>
          cli.folders.getItems(offset).then(response => {
            rndItem =
              response.entries[
                Math.floor(Math.random() * response.entries.length)
              ];
            //console.log(rndItem);
            if (rndItem.type == "folder") {
              folders = folders + " > " + rndItem.name;
              return getFolders(rndItem.id);
            } else if (rndItem.type == "file") {
              //console.log(rndItem.name);
              //console.log(folders);
              trimFolders = folders.substring(3, folders.length);

              return { id: rndItem.id, path: trimFolders };
            }
          });

        // start by starting at top folder
        return getFolders(668902937);
      },
    
}