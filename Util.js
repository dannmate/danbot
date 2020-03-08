module.exports = {
    Contains(text,contains_text) {
       return text.indexOf(contains_text) > -1;
    },
    ReplaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    },
    
}