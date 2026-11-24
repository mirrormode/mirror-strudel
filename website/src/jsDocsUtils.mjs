/**
 * compute the list of all function with jsDoc documentation
 *
 * @param {object} jsdocJson
 * @returns {object[]} the list of functions in the same structure as the jsdoc json
 */
export const computeAvailableFunctions = (jsdocJson) => {
  const seen = new Set(); // avoid repetition
  const functions = [];
  for (const doc of jsdocJson.docs) {
    if (!isValid(doc)) continue;
    if (seen.has(doc.name)) continue;

    // jsdoc also uses "tags" for when you use @something in the comments and it doesn't know what
    // @something is. We only want data from comments like `@tags superdough` here.
    // If nothing is specified, we default to "untagged" for debugging
    doc.tags = doc.tags?.filter((t) => t && typeof t === 'string') || ['untagged'];

    const synonyms = doc.synonyms || [];
    let names = [doc.name];
    seen.add(doc.name);
    for (const s of synonyms) {
      if (!s || seen.has(s)) continue;
      names.push(s);
      seen.add(s);
    }
    doc.allNames = names.join(' ');
    doc.synonyms = names.slice(1);
    functions.push(doc);
  }
  return functions.sort((a, b) => /* a.meta.filename.localeCompare(b.meta.filename) +  */ a.name.localeCompare(b.name));
};

const isValid = ({ name, description, tags = [] }) => {
  const isSuperdirtOnly = tags.includes('superdirt') && !tags.includes('superdough');
  return name && !name.startsWith('_') && !!description && !isSuperdirtOnly;
};
