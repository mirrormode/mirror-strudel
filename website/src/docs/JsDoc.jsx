import jsdoc from '../../../doc.json'; // doc.json is built with `npm run jsdoc-json`
const docs = jsdoc.docs.reduce((acc, obj) => Object.assign(acc, { [obj.longname]: obj }), {});
import { MiniRepl } from './MiniRepl';

/**
 *
 * @param {Object} arguments
 * @param {number} [arguments.h] Adds a heading (like 3 for h3). Deprecated, add the heading in MDX instead.
 * @returns
 */
export function JsDoc({ name, h = undefined, hideDescription, punchcard, canvasHeight, hideMiniRepl }) {
  const item = docs[name];
  if (!item) {
    console.warn(`JsDoc for ${name} not found`);
    return <div>Could not load docs for ${name}</div>;
  }
  const CustomHeading = h ? `h${h}` : undefined;
  const description = parseAndReplaceLink(item.description ?? '');
  return (
    <>
      {!!h && <CustomHeading id={name}>{item.longname}</CustomHeading>}
      {!hideDescription && (
        <>
          {!!item.synonyms_text && (
            <span>
              Synonyms: <code>{item.synonyms_text}</code>
            </span>
          )}
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </>
      )}
      {item.params && item.params.length > 0 && <p className="font-bold">Arguments</p>}
      <ul>
        {item.params?.map(({ name, type, description }, i) => {
          // Check if the param is actually the parameter of an object
          const objParamSeperator = name.indexOf('.');
          const isObjectParam = objParamSeperator !== -1;

          return (
            <li key={i} className={isObjectParam ? 'list-none' : ''}>
              {isObjectParam ? name.substring(objParamSeperator + 1) : name} : {type?.names?.join(' | ')}{' '}
              {description ? <> - {removeHtmlTags(description)}</> : ''}
            </li>
          );
        })}
      </ul>
      {item.returns && (
        <p>
          <span className="font-bold">Returns</span>{' '}
          {item.returns
            .map((returnValue) => {
              const description = returnValue.description ? `- ${removeHtmlTags(returnValue.description)}` : '';
              return `${returnValue.type?.names?.join(' | ')} ${description}`;
            })
            .join(' or ')}
        </p>
      )}

      {item.examples?.length ? (
        <div className="space-y-2">
          {item.examples?.map((example, k) => {
            const key = `${item.longname}_example_${k}`;
            return hideMiniRepl ? (
              <pre key={key}>{example}</pre>
            ) : (
              <MiniRepl tune={example} key={key} {...{ punchcard, canvasHeight }} />
            );
          })}
        </div>
      ) : (
        <div />
      )}
    </>
  );
}

/**
 * Replaces the jsDocs link with something else.
 * @param {string} string
 * @param {(name:string,longname: string) => string} [replaceWith]
 */
export const parseAndReplaceLink = (string, replaceWith) => {
  const jsDocsLinkRegex = /\{@link ([a-zA-Z\.#]+)\}/g;
  const fun = replaceWith ?? ((name, longname) => `<a target="_blank" href="/reference#${longname}">${name}</a>`);

  return string.replaceAll(jsDocsLinkRegex, (_, longname) => {
    const name = [...longname.matchAll(/[a-zA-Z]*[\.#]?([a-zA-Z]+)/g)].at(0)?.at(1); //take the string after . or #
    return fun(name ?? longname, longname);
  });
};

const removeHtmlTags = (string) => string.replace(/(<([^>]+)>)/gi, '');
