import {useState} from 'react';
import './App.css';
import pigLogo from './logo.jpg';

//todo:
//+ load next n results (+cursor or offset)
//+ link to the query descriptions
//+ dropdown for sorting the search results
//+ dropdown defining the query type
//+ change placeholder text depending on dropdown
//+ construct custom query via custom forms
//+ openaccess or grab this article from scihub link
//+ show the number of citations
//modals for info 
//get your own api key and store it in the browser
//load "n" results available via successive api requests
//https://dev.elsevier.com/support.html cursor instead of page pagination ?
//export search results as text
//export citation
//request all coauthors via crossref api
//show author orcid/affiliation (popup?) if available
//?more info from crossref if available

const myScopusApiKey = 'a0ea0be72869dfb9e69da96e760f62b9';
const scopusRequestHeaders = new Headers({
  'Accept' : 'application/json',
  'Referrer-Policy' : 'strict-origin-when-cross-origin',
  'X-ELS-APIKey' : myScopusApiKey
});

function Query({field = 'AU-ID', text = '', bool = 'AND', id = 0} = {}) {
  this.id = id;
  this.field = field;
  this.text = text;
  this.bool = bool;
}

function SearchString({handler, query}) {
  const [placeholder, setPlaceholder] = useState('e.g., 14048867800');

  function changePlaceholder(val) {
    const placeholderDict = {
      'AU-ID': 'e.g., 14048867800',
      'AUTHOR-NAME': 'e.g., makaka, g',
      'AFFIL': 'e.g., ural university',
      'FIRSTAUTH': 'e.g., ivanov, i',
      'EDITOR' : 'e.g., bishop, s',
      'TITLE-ABS-KEY' : 'e.g., brain cancer',
      'TITLE' : 'e.g., high entropy oxide',
      'ABS' : 'e.g., anal sphincter',
      'KEY' : 'e.g., perovskite',
      'AUTHKEY' : 'e.g., thermochemistry',
      'CHEM' : 'CAS No or chemical name',
      'PUBYEAR' : 'e.g., 1999, or >1999, or <1999',
      'VOLUME' : 'e.g., 5',
      'ISSUE' : 'e.g., 1',
      'PAGES' : 'e.g., 1-6, or 1, or 6',
      'DOI' : 'e.g., 10.1152/physrev.2001.81.2.741',
      'SRCTITLE' : 'e.g., chemical physics',
      'EXACTSRCTITLE' : 'e.g., materials',
      'ISSN' : 'e.g., 1528-0020',
      'ALL' : 'searches in several fields',
      'REF' : 'searches in references',
      '' : 'see Query Language Tips'
    };
    const hint = placeholderDict[val] ? placeholderDict[val] : 'search query';
    setPlaceholder(hint);
  }

  return (
    <>
      <select 
      name='bool' 
      className='bool-search-dropdown' 
      //</>defaultValue="AND"
      value = {query.bool} 
      onChange={e => {
        handler('bool', e.target.value);
      }}>
        <option value='AND'>AND</option>
        <option value='OR'>OR</option>
        <option value='AND NOT'>AND NOT</option>
      </select>
      <select 
      name='field' 
      className='where-search-dropdown' 
      //defaultValue="AU-ID" 
      value = {query.field} 
      onChange={e => {
        changePlaceholder(e.target.value);
        handler('field', e.target.value);
      }}>
        <optgroup label='Author'>
          <option value='AU-ID'>Scopus author ID</option>
          <option value='AUTHOR-NAME'>Author name</option>
          <option value='AFFIL'>Affiliation</option>
          <option value='FIRSTAUTH'>First author name</option>
          <option value='EDITOR'>Editor name</option>
        </optgroup>
        <optgroup label='Article'>
          <option value='TITLE-ABS-KEY'>Title, Abstract, Keywords</option>
          <option value='TITLE'>Title</option>
          <option value='ABS'>Abstract</option>
          <option value='KEY'>Keywords</option>
          <option value='AUTHKEY'>Author's keywords</option>
          <option value='CHEM'>Chemical</option>
          <option value='PUBYEAR'>Year</option>
          <option value='VOLUME'>Volume</option>
          <option value='ISSUE'>Issue</option>
          <option value='PAGES'>Page(s)</option>
          <option value='DOI'>DOI</option>
        </optgroup>
        <optgroup label='Source'>
          <option value='SRCTITLE'>Source title</option>
          <option value='EXACTSRCTITLE'>Exact source title</option>
          <option value='ISSN'>ISSN</option>
        </optgroup>
        <optgroup label='More'>
          <option value='ALL'>Everywhere</option>
          <option value='REF'>References</option>
          <option value=''>Custom Query</option>
        </optgroup>
      </select>
      <input 
      required 
      type="text" 
      placeholder={placeholder} 
      name='query' 
      value = {query.text} 
      onChange={e => {
        handler('text', e.target.value);
      }} />
    </>
  );
}

function AddRemoveSearchString({addOnly, handler, index}) {
  const minus = addOnly ? null : <span className='add-remove-search remove-search' onClick={() => handler('-', index)}>−</span>;
  return (
    <div className='add-remove-search-container'>
      {minus}
      <span className='add-remove-search add-search' onClick={() => handler('+', index)}>+</span>
    </div>
  );
}

function SearchStringList({queries, updateHandler, addRemoveHandler}) {
  const searchStrings = queries.map((q, index) => {
    return (
    <li key={q.id} className='search-string' autoComplete='on'>
      <SearchString query={q} handler={(what, content) => updateHandler(what, content, index)} />
      <AddRemoveSearchString addOnly={queries.length <= 1} handler={addRemoveHandler} index={index} />
    </li>
    );
  });
  return <ul>{searchStrings}</ul>;
}

function SearchForm({onSubmit}) {
  const [queries, setQueries] = useState([new Query()]);

  function handleAddRemoveQuery(whatToDo, index) {
    if (whatToDo === '-') {
      setQueries(queries.filter((q,i) => i !== index));
    } else {
      const timestamp = Date.now();
      const insertAt = index + 1; // Could be any index
      setQueries([
        ...queries.slice(0, insertAt), 
        new Query({id : timestamp}),
        ...queries.slice(insertAt)]);
    }
  }

  function handleUpdateQuery(what, content, index) {
    setQueries(queries.map((q, i) => {
      if (i !== index) {
        return q;
      } else {
        let newq = {...q};
        newq[what] = content;
        return newq;
      }
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());
    //constructing the query string from the form entries
    //https://dev.elsevier.com/sc_search_tips.html
    //formJson is now used for the sort order only,
    //everything else we're getting from the queries state
    const wholeQueryString = queries.reduce((whole, query, index) => {
      //if search field is '' than it's a custom query
      let queryString = '';
      switch (query['field']) {
        case '':
          queryString = query['text'];
          break;
        //for reasons unknown, pubyear is a special case
        case 'PUBYEAR':
        case 'pubyear':
          const re = /\s*(?<symbol>[<>=]?)\s*(?<year>\d+)\s*/;
          const match = query['text'].match(re);
          if (match) {
            if (match.groups.symbol) {
              queryString = `PUBYEAR ${match.groups.symbol} ${match.groups.year}`;
            } else {
              queryString = `PUBYEAR = ${match.groups.year}`;
            }
          }
          break;
        default:
          queryString = `${query['field']}(${query['text']})`;
          break;
      }
      //if not the first or only search string, have to prepend the boolean operator
      if (index > 0) {
        queryString = `${query['bool']} ${queryString}`;
      }
      return `${whole} ${queryString}`;
    }, '');

    const newQuery = {
      'query' : wholeQueryString,
      'sort' : formJson['sort-order'] + formJson['sort-by']
    };
    onSubmit(newQuery);
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <SearchStringList queries={queries} updateHandler={handleUpdateQuery} addRemoveHandler={handleAddRemoveQuery} />
      <div className='sort-dropdowns'>
        <label htmlFor="sort-by">Sort by 
          <select name="sort-by" id="sort-by" defaultValue="pubyear">
            <option value='pubyear'>Publication year</option>
            <option value='coverDate'>Cover date</option>
            <option value='relevancy'>Relevancy</option>
            <option value='citedby-count'>Citation count</option>
          </select>
        </label>
        <select name='sort-order' id='sort-order' defaultValue="-">
          <option value='-'>Descending</option>
          <option value='+'>Ascending</option>
        </select>
      </div>
      <input type="submit" value="Search" />
    </form>
  );
}

function SearchStatus({reply}) {
  if (reply === undefined) {
    return (
      <div className='search-status'>
        <p>Fetching...</p>
      </div>
    );
  } else if (reply) {
    return (
      <div className='search-status'>
        <p className='uri-text'>{decodeURI(reply.url)}</p>
        <p className={reply.ok ? "allright-text" : "error-text"}>{reply.status} {reply.statusText}</p>
      </div>
    );
  } else {
    return null;
  }
}

function SearchCounts({replyJSON, entries}) {
  if (replyJSON && entries) {
    if (replyJSON["service-error"]) {
      //great, now I don't remember what would cause this case
      return <p className='search-results-error'>Error: {replyJSON["service-error"]["status"]["statusCode"]}
                            ({replyJSON["service-error"]["status"]["statusText"]})</p>;
    } else {
      const totalResults = replyJSON["search-results"]["opensearch:totalResults"];
      const perPageResults = replyJSON["search-results"]["opensearch:itemsPerPage"];
      const totalEntries = entries.length;
      return (
        <div className='search-description'>
          <p>results: {totalResults} in total ({perPageResults} per page, {totalEntries} shown)</p>
        </div>
      );
    }
  } else {
    return null;
  }
}

//in the following quite a few functions (up to SearchResults), 
//'e' stands for an entry in the search result entries
//could've passed more specific props but don't see the need for that right now
function EntryType({e}) {
  let citedbyText = "";
  const citedbyCount = e["citedby-count"];
  citedbyText = citedbyCount ? ` • ${citedbyCount} citation` : "";
  if (citedbyCount !== "1") {
    citedbyText += 's';
  }
  return <p className='entry-type'>{e["prism:aggregationType"]} {e["subtypeDescription"]}{citedbyText}</p>;
}
function UnescapedTitle({e}) {
  function titleHTML() {
    let title = e["dc:title"];
    //correcting the subscripts
    const regex = /inf>/ig;
    title = title.replaceAll(regex, "sub>");
    return {__html: title};
  }
  return <p className='entry-title' dangerouslySetInnerHTML={titleHTML()} />;
}
function Authors({e}) {
  return <p className='entry-authors'>{e["dc:creator"]} (et al.?)</p>;
}
function EntrySource({e}) {
  const pages = e["prism:pageRange"] ? e["prism:pageRange"] : e["article-number"];
  return (<p className='entry-source'>
      <span className='publication-name'>{e["prism:publicationName"]}</span>, {e["prism:coverDisplayDate"]}, {e["prism:volume"]}, {pages}
    </p>);
}
function ScopusLink({e}) {
  let scopusLink;
  for (let link of e["link"]) {
    if (link["@ref"] === "scopus") {
      scopusLink = link["@href"];
      break;
    }
  }
  return <p className='entry-scopuslink'><a href={scopusLink} target="_blank" rel='noreferrer'>This entry in Scopus: {e["dc:identifier"]}</a></p>;
}
function DoiLink({e}) {
  if (e["prism:doi"]) {
    const doiHref = "https://doi.org/" + e["prism:doi"];
    return <p className='entry-doilink'><a href={doiHref} target="_blank" rel='noreferrer'>doi:{e["prism:doi"]}</a></p>;
  }
}
function AccessIndicator({e}) {
  if (e["openaccessFlag"]) {
    return <p className='access-indicator'>This is an open access article</p>;
  } else if (e["prism:doi"]) {
    const sciHubHref = `https://sci-hub.ru/${e["prism:doi"]}`;
    return <p className='access-indicator'><a href={sciHubHref} target="_blank" rel='noreferrer'>Grab this from SciHub</a></p>;
  } else {
    return null;
  }
}
function SearchResults({entries}) {
  let searchResultsBody;
  if (entries.length > 0) {
    const searchResultsList = entries.map((e) => {
      return (
        <li className='search-results-entry' key={e["dc:identifier"]}>
          <EntryType e={e} />
          <UnescapedTitle e={e} />
          <Authors e={e} />
          <EntrySource e={e} />
          <ScopusLink e={e} />
          <DoiLink e={e} />
          <AccessIndicator e={e} />
        </li>
      );
      //todo: what if the field not found
    });
    searchResultsBody = <ol>{searchResultsList}</ol>
  }
  return (
    <div className='search-results'>
      {searchResultsBody}
    </div>
  );
}

function MoreButton({replyJSON, handleQuery}) {
  if (replyJSON && replyJSON["search-results"]) {
    const totalResults = parseInt(replyJSON["search-results"]["opensearch:totalResults"]);
    const startIndex = parseInt(replyJSON["search-results"]["opensearch:startIndex"]);
    const itemsPerPage = parseInt(replyJSON["search-results"]["opensearch:itemsPerPage"]);
    if (totalResults > startIndex + itemsPerPage) {
      return (
        <div className='more-button-container'>
          <input type='button' className='more-button' onClick={() => {handleQuery(null)}} value='↓ more ↓'/>
        </div>
      );
    } else {
      return null;
    }
  }
}

const Modal = ({ handleClose, show, header, children }) => {
  const showHideClassName = show ? "modal display-block" : "modal display-none";

  return (
    <div className={showHideClassName} onClick={handleClose}>
      <article className="modal-window" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          {header}
          <button className="modal-close-button" onClick={handleClose}>×</button>
        </header>
        <section className="modal-content">
          {children}
        </section>
      </article>
    </div>
  );
};

function App() {
  const [reply, setReply] = useState(null);
  const [replyJSON, setReplyJSON] = useState(null);
  const [entries, setEntries] = useState([]);
  const [modalShowWhat, setModalShowWhat] = useState(false);

  const handleQuery = (newQuery) => {
    let url = 'https://api.elsevier.com/content/search/scopus';
    //if not newQuery, then continue the old one
    const continueQuery = !newQuery;
    let startIndex = 0;
    let searchParams;
    if (continueQuery) {
      newQuery = replyJSON["search-results"]["opensearch:Query"]["@searchTerms"];
      const oldStartIndex = parseInt(replyJSON["search-results"]["opensearch:startIndex"]);
      const itemsPerPage = parseInt(replyJSON["search-results"]["opensearch:itemsPerPage"]);
      startIndex = oldStartIndex + itemsPerPage;
      //getting the searchParams from the last reply url and replacing only the start value
      const url = new URL(reply.url);
      const searchParamsArray = Array.from(url.searchParams.entries());
      const newSearchParamsArray = searchParamsArray.map(x => x[0] === "start" ? [x[0], startIndex.toString()]: x);
      searchParams = new URLSearchParams(newSearchParamsArray);
    } else {
      //seems like 'count' : 25 is the max for a search request
      searchParams = new URLSearchParams({
        'query' : newQuery["query"],
        'sort' : newQuery["sort"],
        'start' : startIndex,
        'count' : 25
      });
    }
    url += '?' + searchParams.toString();
    setReply(undefined);
    fetch(url, {headers : scopusRequestHeaders, mode : 'cors'})
    .then((response) => {
      setReply(response);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => {
      setReplyJSON(json);
      try {
        const newEntries = json["search-results"]["entry"];
        const searchError = (newEntries.length === 1 && newEntries[0]["error"]);
        if (continueQuery) {
          if (!searchError) {
            setEntries([...entries, ...newEntries]);
          }
        } else {
          if (!searchError) {
            setEntries(newEntries);
          } else {
            setEntries([]);
          }
        }
      } catch(error) {
        console.error(error);
      }
    })
    .catch((err) => console.error(`Fetch problem: ${err.message}`));
  }

  return (
    <>
      <header>
        <img src={pigLogo} alt="pig logo" />
        <h1>Skotus <span className="text-gray">Eternal Beta</span></h1>
        <div className='header-links-container'>
          <button className="button-link-lookalike" onClick={() => setModalShowWhat(true)}>What?</button>
        </div>
      </header>
      <main>
        <SearchForm onSubmit={handleQuery} />
        <SearchStatus reply={reply} />
        <SearchCounts replyJSON={replyJSON} entries={entries} />
        <SearchResults entries={entries} />
        <MoreButton replyJSON={replyJSON} handleQuery={handleQuery} />
      </main>
      <footer>
        <p>these data were obtained via <a href="https://dev.elsevier.com" target="_blank" rel='noreferrer'>Scopus API</a></p>
        <p><a href='https://dev.elsevier.com/sc_search_tips.html' target='_blank' rel='noreferrer'>Query Language Tips</a></p>
        <p>see also <a href="https://www.scopus.com/freelookup/form/author.uri" target="_blank" rel='noreferrer'>Free Scopus Author Search</a></p>
      </footer>
      <Modal show={modalShowWhat} handleClose={() => setModalShowWhat(false)} header='What is it?'>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam orci augue, gravida a mattis sed, placerat id eros. Aliquam suscipit molestie maximus. Mauris sit amet ornare mi. Curabitur imperdiet enim felis. In rutrum, metus sit amet eleifend viverra, nisl ex condimentum nulla, non pulvinar libero magna a nisl. Nam pretium quis ante id condimentum. Phasellus ex risus, aliquet ac sem ac, venenatis semper odio. Suspendisse enim nunc, scelerisque non arcu eu, fringilla faucibus sem. Nulla id felis posuere, viverra ante a, cursus arcu. Praesent ultricies at est sit amet varius. Vestibulum pellentesque gravida magna, sed lacinia purus aliquam sit amet. In urna lacus, mollis bibendum ante a, sollicitudin commodo elit. Nunc tempus ligula finibus porta placerat. Nulla leo diam, vulputate vel tristique id, imperdiet at elit. Etiam et mattis felis, quis luctus lorem.</p>
        <p>Nulla facilisi. Aliquam accumsan malesuada fermentum. Phasellus dictum, dolor et vestibulum facilisis, diam nisl fermentum purus, ut convallis sem mauris nec quam. Donec condimentum quis mauris ut maximus. Aliquam eget metus in felis faucibus fringilla molestie eu metus. Etiam a nibh enim. Suspendisse suscipit vehicula augue ac lobortis. Suspendisse velit arcu, accumsan sed aliquet quis, maximus non odio. In porta finibus odio, quis cursus augue euismod vel. Nulla sapien mauris, malesuada a dui ultrices, commodo mattis ante. Nulla eleifend aliquet nunc a vestibulum. Praesent rutrum ligula ut bibendum varius. Etiam sapien tortor, tristique eu fermentum nec, pulvinar at dolor. Praesent at condimentum lacus, in pellentesque arcu.</p>
        <p>In hac habitasse platea dictumst. Aenean venenatis sem at dolor maximus, ac elementum nisl aliquam. Aenean et placerat felis, in pulvinar sapien. Pellentesque commodo purus nec nunc auctor euismod. Nulla odio velit, ultrices ut nisi vitae, molestie pretium lectus. Cras in dolor justo. Curabitur ornare placerat mi, in tristique risus ornare at. Nullam vestibulum ultrices vulputate. Donec ornare fringilla dui in mollis. Praesent mollis sem rhoncus, pellentesque lacus non, imperdiet dui. Nullam mollis nisl id suscipit placerat. Nunc facilisis erat nec orci fermentum, fermentum maximus orci ornare. Aliquam libero felis, mattis vel lectus eget, varius congue ipsum. Pellentesque quis quam rhoncus, consectetur enim at, venenatis dolor. Pellentesque eu mauris ornare, tristique ipsum sit amet, laoreet nisi. Maecenas lectus nisl, lacinia eu dapibus ut, iaculis sed risus.</p>
        <p>Pellentesque pretium tortor nec est vulputate, eu accumsan odio vestibulum. Morbi aliquam neque sit amet rutrum ultricies. Mauris eu lorem magna. Morbi non tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Vestibulum ut purus dapibus velit volutpat mollis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vestibulum sed arcu metus. Aliquam bibendum quis sapien at molestie. Maecenas luctus ante vitae nunc sodales, lacinia pellentesque libero hendrerit. Vestibulum nec varius sapien, id vulputate purus. Suspendisse finibus rhoncus odio, quis bibendum ipsum condimentum non. Sed sagittis eu ex at feugiat. Nunc ligula eros, laoreet sit amet magna in, facilisis laoreet dui. Proin tristique suscipit leo.</p>
        <p>Nunc mi nunc, egestas et vulputate eget, ultricies nec tellus. Curabitur euismod diam mauris, vel molestie magna molestie id. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nunc rutrum maximus est, eget consectetur mi blandit quis. Nulla ornare vestibulum arcu, vel scelerisque ex congue at. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. In gravida lectus sit amet mollis malesuada. Donec molestie dui nisl, at lacinia elit volutpat pretium. Praesent vel nisl ultricies, scelerisque ex at, luctus odio. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed aliquet dictum cursus. Sed pulvinar luctus ligula. Duis eu ipsum justo. Mauris sit amet facilisis odio. Donec nunc magna, convallis eu lacus sit amet, faucibus porta neque. Praesent finibus nec mi ac venenatis.</p>
      </Modal>
    </>
  );
}

export default App;
