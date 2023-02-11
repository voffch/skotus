import {useState} from 'react';
import './App.css';

//todo:
//load next n results (+cursor or offset)
//link to the query descriptions
//construct custom query via custom forms
//dropdown defining the query type
//request all coauthors via crossref api
//dropdown for sorting the search results
//show the number of citations
//show author orcid/affiliation (popup?) if available
//load "n" results available via successive api requests
//?more info (abstract?) from crossref if available

const myScopusApiKey = 'a0ea0be72869dfb9e69da96e760f62b9';
const scopusRequestHeaders = new Headers({
  'Accept' : 'application/json',
  'Referrer-Policy' : 'strict-origin-when-cross-origin',
  'X-ELS-APIKey' : myScopusApiKey
});

function SearchForm({onSubmit}) {
  const [query, setQuery] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(query);
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input required type="text" placeholder="author ID or search query" value={query} onChange={(e) => setQuery(e.target.value)}/>
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
        <p>{reply.url}</p>
        <p className={reply.ok ? "allright-text" : "error-text"}>{reply.status} {reply.statusText}</p>
      </div>
    );
  } else {
    return null;
  }
}

function SearchResults({data}) {
  let searchResultsBody;
  if (data) {
    if (data["service-error"]) {
      //great, now I don't remember what would cause this case
      return <p className='search-results-error'>Error: {data["service-error"]["status"]["statusCode"]}
                            ({data["service-error"]["status"]["statusText"]})</p>;
    } else {
      const totalResults = data["search-results"]["opensearch:totalResults"];
      const perPageResults = data["search-results"]["opensearch:itemsPerPage"];
      const entries = data["search-results"]["entry"];
      if (parseInt(totalResults) > 0) {
        const searchResultsList = entries.map((e) => {
          function EntryType() {
            return <p className='entry-type'>{e["prism:aggregationType"]} {e["subtypeDescription"]}</p>;
          }
          function titleHTML() {
            return {__html: e["dc:title"]};
          }
          function UnescapedTitle() {
            return <p className='entry-title' dangerouslySetInnerHTML={titleHTML()} />;
          }
          function Authors() {
            return <p className='entry-authors'>{e["dc:creator"]} (et al.?)</p>;
          }
          function EntrySource() {
            const pages = e["prism:pageRange"] ? e["prism:pageRange"] : e["article-number"];
            return (<p className='entry-source'>
                <span className='publication-name'>{e["prism:publicationName"]}</span>, {e["prism:coverDisplayDate"]}, {e["prism:volume"]}, {pages}
              </p>);
          }
          function ScopusLink() {
            let scopusLink;
            for (let link of e["link"]) {
              if (link["@ref"] === "scopus") {
                scopusLink = link["@href"];
                break;
              }
            }
            return <p className='entry-scopuslink'><a href={scopusLink} target="_blank" rel='noreferrer'>This entry in Scopus: {e["dc:identifier"]}</a></p>;
          }
          function DoiLink() {
            if (e["prism:doi"]) {
              const doiHref = "https://doi.org/" + e["prism:doi"];
              return <p className='entry-doilink'><a href={doiHref} target="_blank" rel='noreferrer'>doi:{e["prism:doi"]}</a></p>;
            }
          }
          return (
            <li className='search-results-entry' key={e["dc:identifier"]}>
              <EntryType />
              <UnescapedTitle />
              <Authors />
              <EntrySource />
              <ScopusLink />
              <DoiLink />
            </li>
          );
          //todo: what if the field not found
        });
        searchResultsBody = <ol>{searchResultsList}</ol>
      }
      return (
        <>
        <div className='search-description'>
          <p>{totalResults} results in total ({perPageResults} per page)</p>
        </div>
        <div className='search-results'>
          {searchResultsBody}
        </div>
        </>
      );
    }
  }
}

function App() {
  const [reply, setReply] = useState(null);
  const [replyJSON, setReplyJSON] = useState(null);

  const handleQuery = (newQuery) => {
    let url = 'https://api.elsevier.com/content/search/scopus';
    //AU-ID(14048867800), https://dev.elsevier.com/sc_search_tips.html
    //if it's a number, then it's an author ID
    newQuery = isNaN(newQuery) ? newQuery : `AU-ID(${newQuery})`;
    //seems like 'count' : 25 is the max for a search request
    const searchParams = new URLSearchParams({
      'query' : newQuery,
      'count' : 25
    });
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
    .then((json) => setReplyJSON(json))
    .catch((err) => console.error(`Fetch problem: ${err.message}`));
  }

  return (
    <>
      <SearchForm onSubmit={handleQuery} />
      <SearchStatus reply={reply} />
      <SearchResults data={replyJSON} />
    </>
  );

  /*<div className='more-button-container'>
  <input type='button' className='more-button' onClick={handleQuery} value='more'/>
  </div>*/
}

export default App;
